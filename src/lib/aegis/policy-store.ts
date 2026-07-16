import { db } from '@/lib/db';
import type { EntityType, Policy, Strictness } from './types';
import { ALL_ENTITY_TYPES } from './types';

/**
 * Policy persistence — the default (active) policy is stored in the Policy table.
 * Glossary terms live in the GlossaryTerm table for easy add/remove.
 *
 * In production this is org-scoped + multi-seat. Here: one active policy.
 */

export const DEFAULT_POLICY: Policy = {
  strictness: 'balanced',
  enabledEntityTypes: [...ALL_ENTITY_TYPES],
  customGlossary: ['Acme Corp', 'Project Phoenix', 'Project Titan'],
};

function parseEnabledTypes(raw: string): EntityType[] {
  if (!raw) return [...ALL_ENTITY_TYPES];
  return raw.split(',').filter(Boolean) as EntityType[];
}

function parseGlossary(raw: string): string[] {
  if (!raw) return [];
  return raw.split('\n').map((s) => s.trim()).filter(Boolean);
}

/** Get the active policy. Seeds defaults on first call. */
export async function getActivePolicy(): Promise<Policy> {
  let row = await db.policy.findFirst({ where: { active: true } });
  if (!row) {
    row = await db.policy.create({
      data: {
        name: 'default',
        strictness: DEFAULT_POLICY.strictness,
        enabledEntityTypes: DEFAULT_POLICY.enabledEntityTypes.join(','),
        customGlossary: DEFAULT_POLICY.customGlossary.join('\n'),
        active: true,
      },
    });
    // Seed glossary rows.
    for (const term of DEFAULT_POLICY.customGlossary) {
      await db.glossaryTerm.upsert({
        where: { term },
        create: { term },
        update: {},
      });
    }
  }
  return {
    strictness: row.strictness as Strictness,
    enabledEntityTypes: parseEnabledTypes(row.enabledEntityTypes),
    customGlossary: parseGlossary(row.customGlossary),
  };
}

/** Update the active policy. */
export async function updateActivePolicy(patch: Partial<Policy>): Promise<Policy> {
  const current = await getActivePolicy();
  const next: Policy = {
    strictness: patch.strictness ?? current.strictness,
    enabledEntityTypes: patch.enabledEntityTypes ?? current.enabledEntityTypes,
    customGlossary: patch.customGlossary ?? current.customGlossary,
  };
  await db.policy.updateMany({
    where: { active: true },
    data: {
      strictness: next.strictness,
      enabledEntityTypes: next.enabledEntityTypes.join(','),
      customGlossary: next.customGlossary.join('\n'),
    },
  });
  return next;
}

/** Get all glossary terms (for the dashboard manager UI). */
export async function getGlossaryTerms(): Promise<string[]> {
  const rows = await db.glossaryTerm.findMany({ orderBy: { term: 'asc' } });
  return rows.map((r) => r.term);
}

/** Add a glossary term. Idempotent. */
export async function addGlossaryTerm(term: string): Promise<void> {
  const t = term.trim();
  if (t.length < 2) return;
  await db.glossaryTerm.upsert({
    where: { term: t },
    create: { term: t },
    update: {},
  });
}

/** Remove a glossary term. */
export async function removeGlossaryTerm(term: string): Promise<void> {
  await db.glossaryTerm.deleteMany({ where: { term: term.trim() } });
}
