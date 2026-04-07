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
   * Verifies the generated answer against context chunks for factual groundedness.
   * Based on the standard 'Verifier/Fact-Checking' pattern.
   */
  public static async verifyAnswer(params: {
    answer: string;
    chunks: any[];
    modelId: string;
    modelRuntime: ModelRuntime;
    query: string;
  }): Promise<VerificationResult> {
    const { query, answer, chunks, modelRuntime, modelId } = params;

    try {
      log(`Verifying answer against ${chunks.length} chunks using ${modelId}...`);

      const result = await modelRuntime.generateObject({
        messages: [
          {
            content: agenticVerifierSystemPrompt(query, answer),
            role: 'system',
          },
          {
            content: `CONTEXT CHUNKS:\n${JSON.stringify(chunks.map((c) => ({ content: c.content, id: c.id })))}`,
            role: 'user',
          },
        ],
        model: modelId,
        schema: {
          name: 'agentic_verifier',
          schema: {
            properties: {
              issues: {
                description: 'List of factual errors or unsupported claims found.',
                items: { type: 'string' },
                type: 'array',
              },
              isValid: {
                description: 'Whether the answer is fully grounded in the provided chunks.',
                type: 'boolean',
              },
              scratchpad: {
                description: 'Step-by-step cross-verification results.',
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
        log(`Verification results: ${verified.isValid ? 'VALID' : 'INVALID'}`);
        if (verified.issues.length > 0) log(`Issues: ${verified.issues.join(' | ')}`);

        return {
          issues: verified.issues,
          isValid: verified.isValid,
        };
      }
    } catch (error) {
      console.error('[Agentic Verifier] Groundedness check failed:', error);
    }

    // Default to valid if verification fails to prevent blocking the user experience
    return {
      issues: [],
      isValid: true,
    };
  }
}
