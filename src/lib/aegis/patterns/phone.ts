import type { PatternModule } from '../types';

// Phone numbers — E.164 (+91...) and India mobile (10-digit starting 6-9).
// Kept conservative to avoid matching every 10-digit number.
const PHONE_PATTERNS: RegExp[] = [
  /\+\d{1,3}[-\s]?\d{3,5}[-\s]?\d{3,5}[-\s]?\d{0,5}\b/g, // E.164-ish
  /\b(?:\+91[-\s]?)?[6-9]\d{9}\b/g, // India mobile
];

export const phonePattern: PatternModule = {
  type: 'PHONE',
  baseConfidence: 0.82,
  find(text: string) {
    const out: Array<{ value: string; startIndex: number; endIndex: number }> = [];
    for (const re of PHONE_PATTERNS) {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        // Require at least 10 digits to reduce false positives.
        const digits = m[0].replace(/\D/g, '');
        if (digits.length < 10) continue;
        out.push({ value: m[0], startIndex: m.index, endIndex: m.index + m[0].length });
      }
    }
    // De-duplicate overlaps.
    out.sort((a, b) => a.startIndex - b.startIndex);
    const deduped: typeof out = [];
    for (const m of out) {
      const last = deduped[deduped.length - 1];
      if (last && m.startIndex < last.endIndex) continue;
      deduped.push(m);
    }
    return deduped;
  },
};
