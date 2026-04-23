import * as Sentry from '@sentry/nextjs';
import { useCallback } from 'react';

import { useUserStore } from '@/store/user';

interface FeedbackOptions {
  /** The message ID this feedback is about */
  messageId?: string;
  /** The topic ID */
  topicId?: string;
  /** Optional user-provided description */
  message?: string;
  /** Sentiment: thumbs up or down */
  sentiment?: 'positive' | 'negative';
}

/**
 * Hook to submit user feedback about a chat message to Sentry.
 * Used by the thumbs-down reaction on assistant messages.
 */
export const useSentryFeedback = () => {
  const larkProfile = useUserStore((s) => s.larkProfile);

  const submitFeedback = useCallback(
    (options: FeedbackOptions) => {
      if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;

      const { messageId, topicId, message, sentiment = 'negative' } = options;

      Sentry.captureFeedback(
        {
          name: larkProfile?.name ?? undefined,
          email: larkProfile?.email ?? undefined,
          message: message ?? (sentiment === 'negative' ? 'Bad response from Brainy' : 'Good response from Brainy'),
        },
        {
          captureContext: {
            tags: {
              sentiment,
              ...(messageId && { messageId }),
              ...(topicId && { topicId }),
              source: 'chat-reaction',
            },
          },
        },
      );
    },
    [larkProfile],
  );

  return { submitFeedback };
};
