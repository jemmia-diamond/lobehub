export const JEMMIA_MODEL_IDS = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];

export const JEMMIA_MODEL_ICON_MAP: Record<string, string> = {
  'gemini-2.5-flash': 'psychology',
  'gemini-2.5-flash-lite': 'bolt',
  'gemini-2.5-pro': 'school',
};

export const JEMMIA_MODEL_LABEL_KEYS: Record<string, string> = {
  'gemini-2.5-flash': 'thinkingMode.deep.title',
  'gemini-2.5-flash-lite': 'thinkingMode.fast.title',
  'gemini-2.5-pro': 'thinkingMode.expert.title',
};

export const JEMMIA_MODEL_DESC_KEYS: Record<string, string> = {
  'gemini-2.5-flash': 'thinkingMode.deep.description',
  'gemini-2.5-flash-lite': 'thinkingMode.fast.description',
  'gemini-2.5-pro': 'thinkingMode.expert.description',
};
