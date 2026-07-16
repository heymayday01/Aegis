import type { DetectionResult, EntityType, Policy, RedactionResult } from './types';
import { detect } from './detect';

/**
 * Tokenization — reversible pseudonymization.
 * john@acme.com → [AEGIS:EMAIL:A1B2]
 *
 * Token format preserves the entity TYPE (so the downstream AI sees structure) but
 * hides the VALUE. The token→value map is returned to the caller and NEVER persisted
 * server-side in this demo (the architecture's persistence lives client-side /
 * in-customer-infra only).
 *
 * Token IDs are derived from a per-call counter + random hex, NOT from the value,
 * so the same value in two different calls gets different tokens (avoids cross-call
 * correlation; tradeoff: caller must hold the map to rehydrate, which is the point).
 */

const TOKEN_ALPHABET = '0123456789ABCDEF';

function randomTokenId(len = 4): string {
  let s = '';
  for (let i = 0; i < len; i++) {
    s += TOKEN_ALPHABET[Math.floor(Math.random() * TOKEN_ALPHABET.length)];
  }
  return s;
}

function makeToken(type: EntityType, used: Set<string>): string {
  // Generate a unique 4-hex token id for this type.
  for (let attempt = 0; attempt < 64; attempt++) {
    const id = randomTokenId(4);
    const token = `[AEGIS:${type}:${id}]`;
    if (!used.has(token)) {
      used.add(token);
      return token;
    }
  }
  // Extremely unlikely fallback.
  const id = randomTokenId(8);
  const token = `[AEGIS:${type}:${id}]`;
  used.add(token);
  return token;
}

/**
 * redact() — detect + tokenize in one pass. Returns redacted text + the token map.
 */
export function redact(text: string, policy: Policy): RedactionResult {
  const detections = detect(text, policy);
  if (detections.length === 0) {
    return { redactedText: text, tokenMap: {}, detections: [] };
  }

  const tokenMap: Record<string, string> = {};
  const used = new Set<string>();

  // Build redacted text by walking detections in order, splicing in tokens.
  let redacted = '';
  let cursor = 0;
  for (const d of detections) {
    redacted += text.slice(cursor, d.startIndex);
    const token = makeToken(d.entityType, used);
    tokenMap[token] = d.value;
    redacted += token;
    cursor = d.endIndex;
  }
  redacted += text.slice(cursor);

  return { redactedText: redacted, tokenMap, detections };
}

/**
 * rehydrate() — swap tokens back to original values.
 * CRITICAL invariant: rehydrate(redact(text)) === text. Always.
 */
export function rehydrate(redactedText: string, tokenMap: Record<string, string>): string {
  if (!tokenMap || Object.keys(tokenMap).length === 0) return redactedText;
  // Sort tokens by length desc so [AEGIS:EMAIL:A1B2] matches before partial substrings.
  const tokens = Object.keys(tokenMap).sort((a, b) => b.length - a.length);
  let out = redactedText;
  for (const token of tokens) {
    // split/join to avoid $-substitution semantics in replacement strings.
    out = out.split(token).join(tokenMap[token]);
  }
  return out;
}

/**
 * Round-trip self-check. Used by CI + exposed on the dashboard as a live proof.
 */
export function verifyRoundTrip(text: string, policy: Policy): boolean {
  const { redactedText, tokenMap } = redact(text, policy);
  return rehydrate(redactedText, tokenMap) === text;
}
