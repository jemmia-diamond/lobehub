import { type BuiltinSkill } from '@lobechat/types';

import { systemPrompt } from './content';

export const EmailWriterIdentifier = 'lobe-email-writer';

export const EmailWriterSkill: BuiltinSkill = {
  avatar: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNNCA0aDE2YzEuMSAwIDIgLjkgMiAydjEyYzAgMS4xLS45IDItMiAyaC0xNmMtMS4xIDAtMi0uOS0yLTJWNmMwLTEuMS45LTIgMi0yeiIvPjxwYXRoIGQ9Ik0yMiA2bC0xMCA3TDQgNiIvPjwvc3ZnPg==`,
  content: systemPrompt,
  description:
    'Expert assistant for drafting and refining professional emails. Provides guidance on tone, structure, and clarity for various communication scenarios.',
  identifier: EmailWriterIdentifier,
  name: 'Email Writer',
  source: 'builtin',
};
