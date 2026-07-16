import type { PatternModule } from '../types';

// IP addresses — IPv4 and IPv6. Confidence is moderate because IPs appear in non-sensitive
// contexts (logs, examples). Strictness filtering handles the rest.
const IPV4_RE = /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g;
const IPV6_RE = /\b(?:[0-9a-fA-F]{1,4}:){2,7}[0-9a-fA-F]{1,4}\b/g;

export const ipAddressPattern: PatternModule = {
  // 0.82 so IPs are redacted in `balanced` mode (threshold 0.8). In a "send to AI"
  // context, infrastructure IPs are reasonably sensitive; the slight false-positive
  // risk on version-string-like matches is acceptable for v1.
  type: 'IP_ADDRESS',
  baseConfidence: 0.82,
  find(text: string) {
    const out: Array<{ value: string; startIndex: number; endIndex: number }> = [];
    for (const re of [IPV4_RE, IPV6_RE]) {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        // Avoid matching version strings like "1.2.3".
        const v4 = m[0].match(/\./g);
        if (v4 && v4.length === 3) {
          out.push({ value: m[0], startIndex: m.index, endIndex: m.index + m[0].length });
        } else if (!v4) {
          out.push({ value: m[0], startIndex: m.index, endIndex: m.index + m[0].length });
        }
      }
    }
    return out;
  },
};
