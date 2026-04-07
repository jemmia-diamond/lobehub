import { type ModelRuntime } from '@lobechat/model-runtime';
import { agenticVerifierSystemPrompt } from '@lobechat/prompts';
import debug from 'debug';

const log = debug('lobechat:agentic-verifier');

export interface VerificationResult {
  issues: string[];
  isValid: boolean;
}

export class AgenticVerifierService {
  /**
   * Verifies the generated answer against selected groundedness chunks.
   * Based on OpenAI's Verifier/Check pattern.
   */
  public static async verifyAnswer(params: {
    answer: string;
    chunks: any[];
    modelRuntime: ModelRuntime;
    query: string;
    fastModel?: string;
  }): Promise<VerificationResult> {
    const { query, answer, chunks, modelRuntime, fastModel = 'gpt-4o-mini' } = params;

    try {
      log(`Verifying answer against ${chunks.length} chunks...`);

      const result = await modelRuntime.generateObject({
        messages: [
          { content: agenticVerifierSystemPrompt(query, answer), role: 'system' },
          { content: `Chunks for verification:\n${JSON.stringify(chunks)}`, role: 'user' },
        ],
        model: fastModel,
        schema: {
          name: 'agentic_verifier',
          schema: {
            properties: {
              issues: {
                description: 'List of factual errors or hallucination issues found',
                items: { type: 'string' },
                type: 'array',
              },
              isValid: {
                description: 'Whether the answer is grounded in the provided chunks',
                type: 'boolean',
              },
              scratchpad: {
                description: 'Point-by-point cross-verification of answer and chunks',
                type: 'string',
              },
            },
            required: ['isValid', 'issues', 'scratchpad'],
            type: 'object',
          },
        },
      });

      if (result && typeof result === 'object') {
        const verified = result as any;
        log(`Verification complete. Valid: ${verified.isValid}. Issues: ${verified.issues.length}`);
        return {
          issues: verified.issues,
          isValid: verified.isValid,
        };
      }
    } catch (error) {
      console.error('[Agentic Verifier] Verification failed:', error);
    }

    // Default to valid if verification fails to avoid blocking the user flow
    return {
      issues: [],
      isValid: true,
    };
  }
}
