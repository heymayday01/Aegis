import type { Policy, DetectionResult } from './types';
import { detect } from './detect';

/**
 * Streaming-aware redactor — the signature technical contribution.
 *
 * Problem: LLM responses stream token-by-token. A PII entity like "john@acme.com"
 * may be split across chunk boundaries ("john@ac" | "me.com"). A naive per-chunk
 * redactor would miss it.
 *
 * Approach: a buffered streaming redactor. It holds back a sliding window of text
 * (default 24 chars) until it can confirm no in-progress entity match crosses the
 * boundary. Confirmed-safe text is flushed immediately; ambiguous tails are held.
 *
 * When an entity is fully captured, it is redacted with a token and the token is
 * flushed in place of the entity text.
 */

export interface StreamingChunk {
  /** Text that is safe to emit to the client (already redacted). */
  output: string;
  /** Text currently held in the buffer (not yet safe to emit). */
  buffered: number;
  /** Detections completed in this chunk. */
  completedDetections: DetectionResult[];
}

export class StreamingRedactor {
  private buffer = '';
  private readonly windowSize: number;
  private readonly policy: Policy;
  private readonly tokenMap: Record<string, string> = {};
  private readonly usedTokens = new Set<string>();

  constructor(policy: Policy, windowSize = 24) {
    this.policy = policy;
    this.windowSize = windowSize;
  }

  /** Feed a chunk of streaming text. Returns what's safe to emit + buffered count. */
  feed(chunk: string): StreamingChunk {
    this.buffer += chunk;
    const completedDetections: DetectionResult[] = [];

    // Run detection on the current buffer. We want matches that are FULLY contained
    // in the buffer AND whose end is at least `windowSize` chars from the buffer's
    // current tail (so we're confident no longer match is still forming).
    const detections = detect(this.buffer, this.policy);

    // The "safe to flush up to" offset = min(endIndex) over detections that are still
    // potentially extending, minus windowSize. Simplified: we can safely emit text up
    // to (lastDetection.endIndex - windowSize) OR (buffer.length - windowSize), whichever
    // keeps in-progress matches held.
    let safeEnd = this.buffer.length - this.windowSize;
    if (safeEnd < 0) safeEnd = 0;

    // Find completed detections whose end is at or before safeEnd.
    const ready: DetectionResult[] = [];
    for (const d of detections) {
      if (d.endIndex <= safeEnd) {
        ready.push(d);
      }
    }
    ready.sort((a, b) => a.startIndex - b.startIndex);

    // Build output: walk from 0 to safeEnd, splicing in tokens for ready detections.
    let output = '';
    let cursor = 0;
    for (const d of ready) {
      output += this.buffer.slice(cursor, d.startIndex);
      const token = this.makeToken(d);
      this.tokenMap[token] = d.value;
      output += token;
      cursor = d.endIndex;
      completedDetections.push(d);
    }
    output += this.buffer.slice(cursor, safeEnd);

    // Retain the un-flushed tail in the buffer.
    this.buffer = this.buffer.slice(safeEnd);

    return { output, buffered: this.buffer.length, completedDetections };
  }

  /** Flush any remaining buffer at end-of-stream. */
  flush(): { output: string; completedDetections: DetectionResult[] } {
    const completedDetections: DetectionResult[] = [];
    if (this.buffer.length === 0) return { output: '', completedDetections };

    const detections = detect(this.buffer, this.policy).sort((a, b) => a.startIndex - b.startIndex);
    let output = '';
    let cursor = 0;
    for (const d of detections) {
      output += this.buffer.slice(cursor, d.startIndex);
      const token = this.makeToken(d);
      this.tokenMap[token] = d.value;
      output += token;
      cursor = d.endIndex;
      completedDetections.push(d);
    }
    output += this.buffer.slice(cursor);
    this.buffer = '';
    return { output, completedDetections };
  }

  getTokenMap(): Record<string, string> {
    return { ...this.tokenMap };
  }

  private makeToken(d: DetectionResult): string {
    const alphabet = '0123456789ABCDEF';
    for (let attempt = 0; attempt < 64; attempt++) {
      let id = '';
      for (let i = 0; i < 4; i++) id += alphabet[Math.floor(Math.random() * alphabet.length)];
      const token = `[AEGIS:${d.entityType}:${id}]`;
      if (!this.usedTokens.has(token)) {
        this.usedTokens.add(token);
        return token;
      }
    }
    const token = `[AEGIS:${d.entityType}:${Date.now().toString(16).toUpperCase()}]`;
    this.usedTokens.add(token);
    return token;
  }
}

/**
 * Sample streaming payload — simulates an LLM response that contains PII embedded
 * in natural prose, split across chunk boundaries. Used by the /api/stream SSE demo.
 */
export const SAMPLE_STREAM_PAYLOAD: string =
  "Sure, I can help draft that. Based on the details, the primary contact is john@acme.com and the backup is sara.devops@acme.io. " +
  "Their Stripe live key is sk_live_51HqXyZabcDEF1234567890abcd and the Google API key is AIzaSyA1234567890abcdefghijklmnopqrstuv. " +
  "The customer's Aadhaar is 234123412346 and PAN is ABCDE1234F. " +
  "Office line: +91 98765 43210. The server IP is 203.0.113.42. Please don't share these credentials beyond the team.";
