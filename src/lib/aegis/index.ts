// Aegis core engine — public API.
// Source of truth: AEGIS-UPGRADED-PLAN.md §3.

export * from './types';
export { detect } from './detect';
export { redact, rehydrate, verifyRoundTrip } from './tokenize';
export {
  appendAuditEntry,
  getAuditChain,
  tamperEntry,
  repairChain,
  clearChain,
} from './audit';
export { StreamingRedactor, SAMPLE_STREAM_PAYLOAD } from './streaming';
export { ALL_PATTERNS } from './patterns';
