import type { PatternModule } from '../types';

// Email — high-precision, common formats. Not full RFC (intentionally — RFC regexes over-match).
const EMAIL_RE = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;

export const emailPattern: PatternModule = {
  type: 'EMAIL',
  baseConfidence: 0.95,
  find(text: string) {
    const out: Array<{ value: string; startIndex: number; endIndex: number }> = [];
    let m: RegExpExecArray | null;
    EMAIL_RE.lastIndex = 0;
    while ((m = EMAIL_RE.exec(text)) !== null) {
      out.push({ value: m[0], startIndex: m.index, endIndex: m.index + m[0].length });
    }
    return out;
  },
};
