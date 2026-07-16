import type {
  DetectionResult,
  EntityType,
  Policy,
} from './types';
import { STRICTNESS_THRESHOLDS } from './types';
import { ALL_PATTERNS } from './patterns';

/**
 * Glossary matching — case-insensitive, whole-word, non-overlapping.
 * Longer terms are matched first so "Acme Corp" wins over "Acme".
 */
function findGlossaryMatches(
  text: string,
  glossary: string[],
): Array<{ value: string; startIndex: number; endIndex: number }> {
  const terms = glossary
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .sort((a, b) => b.length - a.length);
  if (terms.length === 0) return [];

  const out: Array<{ value: string; startIndex: number; endIndex: number }> = [];
  const matched = new Array<boolean>(text.length).fill(false);

  for (const term of terms) {
    // Escape regex metacharacters in the term.
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`\\b${escaped}\\b`, 'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const start = m.index;
      const end = start + m[0].length;
      // Skip if any char in this span is already matched by a longer term.
      let overlap = false;
      for (let i = start; i < end; i++) {
        if (matched[i]) { overlap = true; break; }
      }
      if (overlap) continue;
      for (let i = start; i < end; i++) matched[i] = true;
      out.push({ value: m[0], startIndex: start, endIndex: end });
    }
  }
  return out;
}

/**
 * detect() — the core detection entrypoint.
 * Runs the regex bank + glossary, applies strictness confidence thresholds,
 * filters by enabled entity types, and de-duplicates overlapping matches
 * (keeping the higher-confidence / more-specific one).
 */
export function detect(text: string, policy: Policy): DetectionResult[] {
  const thresholds = STRICTNESS_THRESHOLDS[policy.strictness];
  const enabled = new Set<EntityType>(policy.enabledEntityTypes);
  const raw: DetectionResult[] = [];

  // Regex bank
  for (const pattern of ALL_PATTERNS) {
    if (!enabled.has(pattern.type)) continue;
    const matches = pattern.find(text);
    for (const m of matches) {
      if (pattern.baseConfidence >= thresholds.regex) {
        raw.push({
          entityType: pattern.type,
          value: m.value,
          startIndex: m.startIndex,
          endIndex: m.endIndex,
          confidence: pattern.baseConfidence,
          source: 'regex',
        });
      }
    }
  }

  // Glossary
  if (enabled.has('CUSTOM_GLOSSARY') && policy.customGlossary.length > 0) {
    const glossaryConfidence = 0.85; // glossary matches are user-asserted, so high confidence
    if (glossaryConfidence >= thresholds.glossary) {
      const matches = findGlossaryMatches(text, policy.customGlossary);
      for (const m of matches) {
        raw.push({
          entityType: 'CUSTOM_GLOSSARY',
          value: m.value,
          startIndex: m.startIndex,
          endIndex: m.endIndex,
          confidence: glossaryConfidence,
          source: 'glossary',
        });
      }
    }
  }

  // De-duplicate overlaps: sort by startIndex asc, then by span length desc (longer wins),
  // then by confidence desc. Walk and drop anything that overlaps a kept match.
  raw.sort((a, b) => {
    if (a.startIndex !== b.startIndex) return a.startIndex - b.startIndex;
    const aLen = a.endIndex - a.startIndex;
    const bLen = b.endIndex - b.startIndex;
    if (aLen !== bLen) return bLen - aLen;
    return b.confidence - a.confidence;
  });

  const final: DetectionResult[] = [];
  for (const d of raw) {
    const last = final[final.length - 1];
    if (last && d.startIndex < last.endIndex) continue; // overlaps kept match, drop
    final.push(d);
  }
  return final;
}
