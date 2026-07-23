// Aegis core engine — type contract.
// Source of truth: AEGIS-UPGRADED-PLAN.md §3.

export type EntityType =
  | 'EMAIL'
  | 'API_KEY'
  | 'PHONE'
  | 'CREDIT_CARD'
  | 'AADHAAR'
  | 'PAN'
  | 'IP_ADDRESS'
  | 'CUSTOM_GLOSSARY';

export type DetectionSource = 'regex' | 'glossary';

export interface DetectionResult {
  entityType: EntityType;
  value: string;
  startIndex: number;
  endIndex: number;
  confidence: number; // 0.0 - 1.0
  source: DetectionSource;
}

export type Strictness = 'paranoid' | 'balanced' | 'permissive';

export interface Policy {
  strictness: Strictness;
  enabledEntityTypes: EntityType[];
  customGlossary: string[];
}

export interface RedactionResult {
  redactedText: string;
  /** token -> original value. In-memory per request ONLY. Never persisted server-side. */
  tokenMap: Record<string, string>;
  detections: DetectionResult[];
}

export interface AuditLogEntry {
  id: string;
  seq: number;
  timestamp: string;
  entityTypesRedacted: EntityType[];
  entityCounts: Record<string, number>;
  destinationProvider: string;
  inputCharCount: number;
  previousHash: string;
  currentHash: string;
  /** Computed on read by re-verifying the chain. */
  tampered: boolean;
}

export interface PatternModule {
  type: EntityType;
  /** Returns raw regex matches (without confidence/strictness filtering). */
  find(text: string): Array<{ value: string; startIndex: number; endIndex: number }>;
  /** Confidence assigned to this entity type's regex matches. */
  baseConfidence: number;
}

// Confidence thresholds per strictness level.
// Permissive: catches structured PII (validated by checksums like Luhn/Verhoeff)
// but skips lower-confidence heuristic matches. Glossary off.
// Balanced: catches everything ≥ 0.8 + glossary. (default)
// Paranoid: catches everything ≥ 0.5 + glossary. Most aggressive.
export const STRICTNESS_THRESHOLDS: Record<Strictness, { regex: number; glossary: number }> = {
  paranoid: { regex: 0.5, glossary: 0.0 },
  balanced: { regex: 0.8, glossary: 0.0 },
  permissive: { regex: 0.9, glossary: 1.0 }, // lowered from 0.95 → 0.9 so validated PII (cards, aadhaar) still catches
};

export const ALL_ENTITY_TYPES: EntityType[] = [
  'EMAIL',
  'API_KEY',
  'PHONE',
  'CREDIT_CARD',
  'AADHAAR',
  'PAN',
  'IP_ADDRESS',
  'CUSTOM_GLOSSARY',
];

export const ENTITY_META: Record<EntityType, { label: string; color: string; description: string }> = {
  EMAIL: { label: 'Email', color: 'amber', description: 'Email addresses' },
  API_KEY: { label: 'API Key', color: 'rose', description: 'AWS, Google, Stripe, GitHub, Slack, generic secrets' },
  PHONE: { label: 'Phone', color: 'cyan', description: 'Phone numbers (E.164, India mobile)' },
  CREDIT_CARD: { label: 'Credit Card', color: 'fuchsia', description: 'Luhn-validated card numbers' },
  AADHAAR: { label: 'Aadhaar', color: 'emerald', description: 'Indian national ID (Verhoeff-validated)' },
  PAN: { label: 'PAN', color: 'violet', description: 'Indian Permanent Account Number' },
  IP_ADDRESS: { label: 'IP Address', color: 'sky', description: 'IPv4 and IPv6 addresses' },
  CUSTOM_GLOSSARY: { label: 'Glossary', color: 'lime', description: 'User-defined sensitive terms' },
};
