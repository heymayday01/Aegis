import type { PatternModule } from '../types';

// API keys — known-vendor formats. Each carries high confidence because the format is vendor-specific.
// Generic high-entropy secrets are matched with lower confidence.
const PATTERNS: Array<{ re: RegExp; confidence: number; label: string }> = [
  { re: /\bAKIA[0-9A-Z]{16}\b/g, confidence: 0.99, label: 'aws' }, // AWS access key
  { re: /\bAIza[0-9A-Za-z\-_]{35}\b/g, confidence: 0.99, label: 'google' }, // Google API key
  { re: /\bsk_(?:live|test)_[0-9a-zA-Z]{24,}\b/g, confidence: 0.99, label: 'stripe' }, // Stripe secret
  { re: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g, confidence: 0.99, label: 'github' }, // GitHub token
  { re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, confidence: 0.99, label: 'slack' }, // Slack token
  { re: /\bsk-[A-Za-z0-9]{20,}\b/g, confidence: 0.9, label: 'openai' }, // OpenAI-style
  { re: /\b[0-9a-f]{32}\b/gi, confidence: 0.7, label: 'generic-hex32' }, // generic 32-hex (e.g. MD5-style secrets)
];

export const apiKeyPattern: PatternModule = {
  type: 'API_KEY',
  baseConfidence: 0.9, // weighted average across sub-patterns; individual confidence applied per-match
  find(text: string) {
    const out: Array<{ value: string; startIndex: number; endIndex: number; confidence: number }> = [];
    for (const { re, confidence } of PATTERNS) {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        out.push({ value: m[0], startIndex: m.index, endIndex: m.index + m[0].length, confidence });
      }
    }
    // De-duplicate overlapping matches, keeping the higher-confidence one.
    out.sort((a, b) => a.startIndex - b.startIndex || b.confidence - a.confidence);
    const deduped: typeof out = [];
    for (const m of out) {
      const last = deduped[deduped.length - 1];
      if (last && m.startIndex < last.endIndex) continue; // overlap, skip
      deduped.push(m);
    }
    // Strip the per-match confidence (PatternModule.find doesn't carry it; detect() applies baseConfidence).
    return deduped.map(({ value, startIndex, endIndex }) => ({ value, startIndex, endIndex }));
  },
};
