import type { PatternModule } from '../types';

// Luhn checksum — validates credit card numbers regardless of brand.
function luhnValid(num: string): boolean {
  const digits = num.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let dbl = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

// Match runs of 12-19 digits, optionally separated by spaces or dashes.
const CARD_RE = /\b(?:\d[ -]?){12,18}\d\b/g;

export const creditCardPattern: PatternModule = {
  type: 'CREDIT_CARD',
  baseConfidence: 0.93,
  find(text: string) {
    const out: Array<{ value: string; startIndex: number; endIndex: number }> = [];
    CARD_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = CARD_RE.exec(text)) !== null) {
      const raw = m[0];
      if (luhnValid(raw)) {
        out.push({ value: raw, startIndex: m.index, endIndex: m.index + raw.length });
      }
    }
    return out;
  },
};
