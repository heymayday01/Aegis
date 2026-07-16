import type { PatternModule } from '../types';

// Verhoeff checksum — validates Aadhaar (12-digit Indian national ID).
// Aadhaar: 12 digits, last digit is Verhoeff checksum. No leading zero.
const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

function verhoeffValid(num: string): boolean {
  const digits = num.replace(/\D/g, '');
  if (digits.length !== 12) return false;
  if (digits[0] === '0') return false;
  let c = 0;
  const len = digits.length;
  for (let i = 0; i < len; i++) {
    const d = digits.charCodeAt(len - 1 - i) - 48;
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][d]];
  }
  return c === 0;
}

const AADHAAR_RE = /\b[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}\b/g;

export const aadhaarPattern: PatternModule = {
  type: 'AADHAAR',
  baseConfidence: 0.96,
  find(text: string) {
    const out: Array<{ value: string; startIndex: number; endIndex: number }> = [];
    AADHAAR_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = AADHAAR_RE.exec(text)) !== null) {
      if (verhoeffValid(m[0])) {
        out.push({ value: m[0], startIndex: m.index, endIndex: m.index + m[0].length });
      }
    }
    return out;
  },
};
