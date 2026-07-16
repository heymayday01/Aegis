import type { PatternModule } from '../types';

// PAN — Indian Permanent Account Number. Format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).
// The 4th letter indicates entity type (P=individual, C=company, etc.) — we accept all for v1.
const PAN_RE = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g;

export const panPattern: PatternModule = {
  type: 'PAN',
  baseConfidence: 0.9,
  find(text: string) {
    const out: Array<{ value: string; startIndex: number; endIndex: number }> = [];
    PAN_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = PAN_RE.exec(text)) !== null) {
      out.push({ value: m[0], startIndex: m.index, endIndex: m.index + m[0].length });
    }
    return out;
  },
};
