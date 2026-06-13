import type {
  AgentStreamClientOptions,
  AgentStreamEvent,
  ConnectionStatus,
} from '@lobechat/agent-gateway-client';
import { AgentStreamClient } from '@lobechat/agent-gateway-client';
import type { ConversationContext, ExecAgentResult } from '@lobechat/types';

import { isDesktop } from '@/const/version';
import { aiAgentService,type ResumeApprovalParam } from '@/services/aiAgent';
import { messageService } from '@/services/message';
import { topicService } from '@/services/topic';
import type { ChatStore } from '@/store/chat/store';
import type { StoreSetter } from '@/store/types';
import { useUserStore } from '@/store/user';

import { topicSelectors } from '../../topic/selectors';
import { createGatewayEventHandler } from './gatewayEventHandler';

type Setter = StoreSetter<ChatStore>;

// ─── Types ───

export interface GatewayConnection {
  client: Pick<
    AgentStreamClient,
    | 'connect'
    | 'disconnect'
    | 'on'
    | 'reconnect'
    | 'sendInterrupt'
    | 'sendToolResult'
    | 'updateToken'
  >;
  status: ConnectionStatus;
}

export interface ConnectGatewayParams {
  /**
   * Gateway WebSocket URL (e.g. https://agent-gateway.lobehub.com)
   */
  gatewayUrl: string;
  /**
   * The local operation ID for UI tracking
   */
  localOperationId?: string;
  /**
   * Callback for each agent event received
   */
  onEvent?: (event: AgentStreamEvent) => void;
  /**
   * Called when the session completes (agent_runtime_end or session_complete)
   */
  onSessionComplete?: () => void;
  /**
   * Called when the session ends due to an error or unexpected disconnect
   */
  onSessionError?: () => void;
  /**
   * The operation ID returned by execAgent
   */
  operationId: string;
  /**
   * Enable resume buffering for reconnect scenarios (default: false)
   */
  resumeOnConnect?: boolean;
  /**
   * Auth token for the Gateway
   */
  token: string;
  /**
   * Topic this op runs against. Used to refresh the Gateway JWT via
   * `aiAgentService.refreshGatewayToken(topicId)` when the server signals
   * `auth_expired`. Every Gateway op has a topic, so this is required.
   */
  topicId: string;
}

// ─── Action Implementation ───

export class GatewayActionImpl {
  readonly #get: () => ChatStore;
  readonly #set: Setter;

  /** Overridable factory for testing */
  createClient: (options: AgentStreamClientOptions) => GatewayConnection['client'] = (options) =>
    new AgentStreamClient(options);

  constructor(set: Setter, get: () => ChatStore, _api?: unknown) {
    void _api;
    this.#set = set;
    this.#get = get;
  }

  /**
   * Connect to the Agent Gateway for a specific operation.
   * Creates an AgentStreamClient, manages its lifecycle, and wires up event callbacks.
   */
  connectToGateway = (params: ConnectGatewayParams): void => {
    const { operationId, gatewayUrl, token, topicId, onEvent, onSessionComplete, onSessionError, resumeOnConnect } = params;

    // Disconnect existing connection for this operation if any
    this.disconnectFromGateway(operationId);

    const client = this.createClient({ gatewayUrl, operationId, resumeOnConnect, token });

    // Track connection in store
    this.#set(
      (state) => ({
        gatewayConnections: {
          ...state.gatewayConnections,
          [operationId]: { client, status: 'connecting' },
        },
      }),
      false,
      'connectToGateway',
    );

    // Wire up status changes
    client.on('status_changed', (status: ConnectionStatus) => {
      this.#set(
        (state) => {
          const conn = state.gatewayConnections[operationId];
          if (!conn) return state;
          return {
            gatewayConnections: { ...state.gatewayConnections, [operationId]: { ...conn, status } },
          };
        },
        false,
        'gateway/statusChanged',
      );
    });

    // ── Helper to ensure single unified cleanup ──
    let isFinished = false;
    const triggerComplete = () => {
      if (isFinished) return;
      isFinished = true;

      this.internal_cleanupGatewayConnection(operationId);
      onSessionComplete?.();
    };

    // Forward agent events to caller, and track terminal events
    // Only fire onSessionComplete from disconnect if a terminal event was received
    let receivedTerminalEvent = false;
    client.on('agent_event', (event: any) => {
      if (event.type === 'agent_runtime_end' || event.type === 'error') {
        receivedTerminalEvent = true;
      }
      if (onEvent) onEvent(event);
    });

    // Handle session completion
    client.on('session_complete', () => {
      triggerComplete();
    });

    // Handle auth failures — server-side terminal: the op no longer exists on
    // the server (GC'd, token rejected, etc.), so the local op must be marked
    // complete. Without this, the local op stays `running` forever and the
    // input stop button never clears; worse, `topic.metadata.runningOperation`
    // never gets cleared either, so each revisit re-triggers the same broken
    // reconnect.
    client.on('auth_failed', (reason: string) => {
      console.error(`[Gateway] Auth failed for operation ${operationId}: ${reason}`);

      if (params.localOperationId) {
        this.#get().failOperation(params.localOperationId, {
          message: reason,
          type: 'gateway_auth_failed',
        });
      }

      onSessionError?.();
      triggerComplete();
    });

    // Handle initial connection failure or unexpected disconnection
    client.on('disconnected', () => {
      if (!isFinished && params.localOperationId) {
        const op = this.#get().operations[params.localOperationId];
        if (op && op.status === 'running') {
          this.#get().failOperation(params.localOperationId, {
            message: 'Gateway connection lost',
            type: 'gateway_disconnect',
          });
        }
      }

      if (receivedTerminalEvent) {
        triggerComplete();
      } else {
        onSessionError?.();
        this.internal_cleanupGatewayConnection(operationId);
      }
    });

    // Handle expired-but-recoverable auth: the JWT is past `exp` but the op
    // is still alive on the server. Refresh the token, hand it to the client,
    // and reconnect. If the refresh itself fails (refresh API down, server
    // refused refresh, etc.), fall back to terminal — leaving the op
    // `running` would freeze the input. The server keeps the ws open after
    // `auth_expired` to give the client a chance to recover, so we must
    // explicitly `disconnect()` before completing — otherwise heartbeat and
    // autoReconnect would keep running past the local op's lifetime.
    client.on('auth_expired', async () => {
      try {
        if (!topicId) throw new Error('Missing topicId for auth_expired refresh');
        const { token: fresh } = await aiAgentService.refreshGatewayToken(topicId);
        client.updateToken(fresh);
        await client.reconnect();
      } catch (error) {
        console.error(`[Gateway] Token refresh failed for operation ${operationId}:`, error);
        if (params.localOperationId) {
          this.#get().failOperation(params.localOperationId, {
            message: 'Token refresh failed',
            type: 'gateway_auth_failed',
          });
        }
        client.disconnect();
        onSessionError?.();
        triggerComplete();
      }
    });

    client.connect();
  };

  /**
   * Disconnect from the Gateway for a specific operation.
   */
  disconnectFromGateway = (operationId: string): void => {
    const conn = this.#get().gatewayConnections[operationId];
    if (!conn) return;

    conn.client.disconnect();
    this.internal_cleanupGatewayConnection(operationId);
  };

  /**
   * Send an interrupt command to stop the agent for a specific operation.
   */
  interruptGatewayAgent = (operationId: string): void => {
    const conn = this.#get().gatewayConnections[operationId];
    if (!conn) return;

    conn.client.sendInterrupt();
  };

  /**
   * Get the connection status for a specific operation.
   */
  getGatewayConnectionStatus = (operationId: string): ConnectionStatus | undefined => {
    return this.#get().gatewayConnections[operationId]?.status;
  };

  /**
   * Check if Gateway mode is available and enabled.
   * Returns true if both server config and user lab toggle are set.
   */
  isGatewayModeEnabled = (): boolean => {
    const agentGatewayUrl =
      window.global_serverConfigStore?.getState()?.serverConfig?.agentGatewayUrl;
    const enableGatewayMode = useUserStore.getState().preference.lab?.enableGatewayMode;

    return !!agentGatewayUrl && !!enableGatewayMode;
  };

  /**
   * Execute agent task via Gateway WebSocket.
   * Call isGatewayModeEnabled() first to check availability.
   */
  /**
   * Execute agent task via Gateway WebSocket.
   * The backend creates user + assistant messages and the topic (if needed).
   * Returns the result so the caller can handle topic switching.
   */
  /**
   * Execute agent task via Gateway WebSocket.
   * The backend creates user + assistant messages and the topic (if needed),
   * then starts the agent. This method handles topic switching and WebSocket connection.
   */
  executeGatewayAgent = async (params: {
    context: ConversationContext;
    message: string;
    /** Called when the gateway session completes (agent finished running) */
    onComplete?: () => void;
    /** Parent message ID for regeneration/continue (skip user message creation, branch from this message) */
    parentMessageId?: string;
    /** File IDs to attach to the task */
    fileIds?: string[];
    /**
     * Caller-owned operation that should be completed once the gateway side
     * has finished phase-1 init (network round-trip + child
     * `execServerAgentRuntime` op started). Lets the caller keep its own
     * loading state running through `execAgentTask` without any gap before
     * the child op takes over. The relationship is also recorded as
     * parent/child lineage on the new op.
     */
    parentOperationId?: string;
    /**
     * Resume a paused op waiting on `human_approve_required`. Forwarded to
     * `aiAgentService.execAgentTask` so the new server-side op knows to apply
     * the user's decision to the target tool message instead of starting from
     * a fresh user prompt.
     */
    resumeApproval?: ResumeApprovalParam;
  }): Promise<ExecAgentResult> => {
    const {
      context,
      fileIds,
      message,
      onComplete,
      parentMessageId,
      parentOperationId,
      resumeApproval,
    } = params;

    const agentGatewayUrl =
      window.global_serverConfigStore!.getState().serverConfig.agentGatewayUrl!;

    const isCreateNewTopic = !context.topicId;

    // Honour user-initiated cancel during phase-1 init: while we await the
    // execAgentTask round-trip the caller's loading state (e.g. `sendMessage`)
    // is still running, so the ChatInput stop button is active. Forward the
    // signal into the request so the fetch aborts in-flight, and re-check
    // afterwards in case cancel arrived just after the request resolved (the
    // server task is then already created — best-effort interrupt it before
    // bailing out, otherwise the agent run continues server-side).
    const abortSignal = parentOperationId
      ? this.#get().getOperationAbortSignal(parentOperationId)
      : undefined;

    const result = await aiAgentService.execAgentTask(
      {
        agentId: context.agentId,
        appContext: {
          groupId: context.groupId,
          scope: context.scope,
          threadId: context.threadId,
          topicId: context.topicId,
        },
        // Tell the server this caller is a desktop Electron client so it can
        // enable `executor: 'client'` tools (local-system, stdio MCP) and
        // dispatch them back over the Agent Gateway WS.
        clientRuntime: isDesktop ? 'desktop' : 'web',
        fileIds,
        parentMessageId,
        prompt: message,
        resumeApproval,
      },
      { signal: abortSignal },
    );

    if (abortSignal?.aborted) {
      // Cancel arrived after execAgentTask resolved — server task exists.
      aiAgentService
        .interruptTask({ operationId: result.operationId })
        .catch((err) => console.error('[Gateway] interruptTask after cancel failed:', err));
      throw abortSignal.reason ?? new DOMException('Aborted', 'AbortError');
    }

    // If server created a new topic, fetch messages first then switch topic
    // (same pattern as client mode: replaceMessages before switchTopic to avoid skeleton flash)
    if (isCreateNewTopic && result.topicId) {
      try {
        const newContext = { ...context, topicId: result.topicId };
        const messages = await messageService.getMessages(newContext);
        this.#get().replaceMessages(messages, { context: newContext });
      } catch {
        /* non-critical */
      }

      await this.#get().switchTopic(result.topicId, {
        clearNewKey: true,
        skipRefreshMessage: true,
      });
      // Refresh sidebar topic list and recents after creating new topic
      // This ensures the new topic appears in the left sidebar history immediately
      await this.#get().refreshTopic();
    }

    // Use the server-created topicId for the execution context
    const execContext = { ...context, topicId: result.topicId };

    if (result.topicId) {
      this.#get().internal_updateTopicLoading(result.topicId, true);
    }

    // Create a dedicated operation for gateway execution with correct context
    const { operationId: gatewayOpId } = this.#get().startOperation({
      context: execContext,
      metadata: { serverOperationId: result.operationId },
      parentOperationId,
      type: 'execServerAgentRuntime',
    });

    // Associate the server-created assistant message with the gateway operation
    this.#get().associateMessageWithOperation(result.assistantMessageId, gatewayOpId);

    // Optimistically update the local store's runningOperation for this topic so
    // useGatewayReconnect doesn't fire for a stale previous operation while the new
    // gateway connection is being established. Also disconnect any live reconnect
    // connection that was already established for the old operation.
    if (result.topicId) {
      const existingTopic = topicSelectors.getTopicById(result.topicId)(this.#get());
      const staleOpId = existingTopic?.metadata?.runningOperation?.operationId;
      if (staleOpId && staleOpId !== result.operationId) {
        this.#get().internal_dispatchTopic({
          id: result.topicId,
          type: 'updateTopic',
          value: {
            metadata: {
              ...existingTopic?.metadata,
              runningOperation: {
                assistantMessageId: result.assistantMessageId,
                operationId: result.operationId,
              },
            },
          },
        });
        this.disconnectFromGateway(staleOpId);
      }
    }

    // Phase-1 init done: child op is running. Hand off loading state from
    // the caller's op (e.g. `sendMessage`) to the child without a gap.
    if (parentOperationId) this.#get().completeOperation(parentOperationId);
    // When the local operation is cancelled (e.g. user clicks stop), forward
    // the interrupt directly to the server via the existing tRPC endpoint.
    this.#get().onOperationCancel(gatewayOpId, async () => {
      await aiAgentService
        .interruptTask({ operationId: result.operationId })
        .catch((err) => console.error('[Gateway] interruptTask failed:', err));
    });

    const eventHandler = createGatewayEventHandler(this.#get, {
      assistantMessageId: result.assistantMessageId,
      context: execContext,
      gatewayOperationId: result.operationId,
      operationId: gatewayOpId,
    });

    this.#get().connectToGateway({
      gatewayUrl: agentGatewayUrl,
      onEvent: eventHandler,
      onSessionComplete: () => {
        this.#get().completeOperation(gatewayOpId);
        if (result.topicId) {
          this.#get().internal_updateTopicLoading(result.topicId, false);
          topicService
            .updateTopicMetadata(result.topicId, { runningOperation: null })
            .catch(() => { });
        }
        onComplete?.();
      },
      onSessionError: () => {
        if (result.topicId) {
          this.#get().internal_updateTopicLoading(result.topicId, false);
        }
      },
      operationId: result.operationId,
      localOperationId: gatewayOpId,
      token: result.token || '',
      topicId: result.topicId,
    });

    return result;
  };

  /**
   * Reconnect to an existing Gateway operation after page reload.
   * Reads runningOperation from topic metadata, refreshes the JWT token,
   * and establishes a new WebSocket connection with event replay.
   */
  reconnectToGatewayOperation = async (params: {
    assistantMessageId: string;
    operationId: string;
    scope?: string;
    threadId?: string | null;
    topicId: string;
  }): Promise<void> => {
    const { assistantMessageId, operationId, topicId, scope, threadId } = params;

    if (!this.isGatewayModeEnabled()) return;

    const agentGatewayUrl =
      window.global_serverConfigStore!.getState().serverConfig.agentGatewayUrl!;

    // Skip reconnect if the topic already has a newer running operation. This
    // happens when executeGatewayAgent was called (creating a new op) while this
    // stale reconnect was still queued — connecting to the old op would produce
    // duplicate streaming events alongside the new connection.
    const topicCurrentOpId = topicSelectors.getTopicById(topicId)(this.#get())?.metadata
      ?.runningOperation?.operationId;
    if (topicCurrentOpId && topicCurrentOpId !== operationId) return;

    // Get a fresh JWT token (original expired after 5 min)
    const { token } = await aiAgentService.refreshGatewayToken(topicId);

    // Re-check after the async token refresh: a newer executeGatewayAgent call may have
    // taken over for this topic while we were waiting. If so, bail to avoid a duplicate stream.
    // (disconnectFromGateway on the stale op is a no-op here because we haven't connected yet.)
    const topicOpIdAfterRefresh = topicSelectors.getTopicById(topicId)(this.#get())?.metadata
      ?.runningOperation?.operationId;
    if (topicOpIdAfterRefresh && topicOpIdAfterRefresh !== operationId) return;

    const agentId = this.#get().activeAgentId;
    const context = {
      agentId,
      scope: (scope ?? 'main') as ConversationContext['scope'],
      threadId: threadId ?? null,
      topicId,
    };

    // Create a local operation for UI loading state
    const { operationId: gatewayOpId } = this.#get().startOperation({
      context,
      type: 'execServerAgentRuntime',
    });

    this.#get().associateMessageWithOperation(assistantMessageId, gatewayOpId);

    // Forward local-op cancellation to the server-side agent loop via tRPC.
    this.#get().onOperationCancel(gatewayOpId, async () => {
      await aiAgentService
        .interruptTask({ operationId })
        .catch((err) => console.error('[Gateway] interruptTask failed:', err));
    });

    const eventHandler = createGatewayEventHandler(this.#get, {
      assistantMessageId,
      context,
      gatewayOperationId: operationId,
      operationId: gatewayOpId,
    });

    this.#get().connectToGateway({
      gatewayUrl: agentGatewayUrl,
      onEvent: eventHandler,
      onSessionComplete: () => {
        this.#get().completeOperation(gatewayOpId);
        this.#get().internal_updateTopicLoading(topicId, false);
        topicService.updateTopicMetadata(topicId, { runningOperation: null }).catch(() => { });
      },
      onSessionError: () => {
        this.#get().internal_updateTopicLoading(topicId, false);
      },
      operationId,
      localOperationId: gatewayOpId,
      resumeOnConnect: true,
      token,
      topicId,
    });
  };

  private internal_cleanupGatewayConnection = (operationId: string): void => {
    this.#set(
      (state) => {
        const { [operationId]: _, ...rest } = state.gatewayConnections;
        return { gatewayConnections: rest };
      },
      false,
      'gateway/cleanup',
    );
  };
}

export type GatewayAction = Pick<GatewayActionImpl, keyof GatewayActionImpl>;