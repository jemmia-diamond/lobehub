import * as Sentry from '@sentry/nextjs';
import { useCallback } from 'react';

import { useUserStore } from '@/store/user';

interface FeedbackOptions {
  /** The content of the message being rated */
  content?: string;
  /** Optional user-provided description */
  message?: string;
  /** The message ID this feedback is about */
  messageId?: string;
  /** Sentiment: thumbs up or down */
  sentiment?: 'positive' | 'negative';
  /** The topic ID */
  topicId?: string;
}

/**
 * Hook to submit user feedback about a chat message to Sentry.
 * Used by the thumbs-down reaction on assistant messages.
 */
export const useSentryFeedback = () => {
  const larkProfile = useUserStore((s) => s.larkProfile);

  const submitFeedback = useCallback(
    (options: FeedbackOptions) => {
      const { messageId, topicId, message, sentiment = 'negative', content } = options;

      const feedbackMessage =
        (message ??
          (sentiment === 'negative' ? 'Bad response from Brainy' : 'Good response from Brainy')) +
        `\n\n[Metadata]\n- Message ID: ${messageId || 'unknown'}\n- Topic ID: ${topicId || 'unknown'}` +
        (content ? `\n\n--- Content ---\n${content}` : '');

      const feedbackData = {
        email: larkProfile?.email ?? undefined,
        message: feedbackMessage,
        name: larkProfile?.name ?? undefined,
      };

      // Send as actual Sentry Feedback (appears in "User Feedback" section)
      if (typeof Sentry.captureFeedback === 'function') {
        Sentry.withScope((scope) => {
          // Set tags on the scope so they are attached to the feedback event
          // This allows filtering in Sentry using: sentiment:negative
          scope.setTag('sentiment', sentiment);
          if (messageId) scope.setTag('messageId', messageId);
          if (topicId) scope.setTag('topicId', topicId);

          Sentry.captureFeedback({
            ...feedbackData,
          });
        });
      }
    },
    [larkProfile],
  );

  return { submitFeedback };
};
