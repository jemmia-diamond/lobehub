import type { LucideProps } from 'lucide-react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import type React from 'react';

export const FilledThumbsUp = ({
  ref,
  ...props
}: LucideProps & { ref?: React.RefObject<SVGSVGElement | null> }) => (
  <ThumbsUp ref={ref} {...props} fill="currentColor" />
);
FilledThumbsUp.displayName = 'FilledThumbsUp';

export const FilledThumbsDown = ({
  ref,
  ...props
}: LucideProps & { ref?: React.RefObject<SVGSVGElement | null> }) => (
  <ThumbsDown ref={ref} {...props} fill="currentColor" />
);
FilledThumbsDown.displayName = 'FilledThumbsDown';
