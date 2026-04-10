export const safeParseJSON = <T = Record<string, any>>(text?: string | T): T | undefined => {
  if (text && typeof text === 'object' && !Array.isArray(text)) return text as T;
  if (typeof text !== 'string') return undefined;

  try {
    return JSON.parse(text);
  } catch {
    // If direct parse fails, attempt defensive extraction for conversational/Markdown-wrapped output
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');

    if (start === -1 || end === -1 || end <= start) {
      return undefined;
    }

    const jsonStr = text.slice(start, end + 1);
    try {
      return JSON.parse(jsonStr) as T;
    } catch (e) {
      try {
        const sanitized = jsonStr.replace(/"scratchpad":\s*"(.*)"\s*,/s, (match, p1) => {
          const escaped = p1.replaceAll(/(?<!\\)"/g, '\\"');
          return `"scratchpad": "${escaped}",`;
        });
        return JSON.parse(sanitized) as T;
      } catch {
        console.error('[safeParseJSON] Final JSON extraction/parse failed:', e, { content: text });
        return undefined;
      }
    }
  }
};
