import { NextRequest, NextResponse } from 'next/server';
import { getActivePolicy, updateActivePolicy, getGlossaryTerms, addGlossaryTerm, removeGlossaryTerm } from '@/lib/aegis/policy-store';
import type { Strictness, EntityType } from '@/lib/aegis/types';
import { ALL_ENTITY_TYPES } from '@/lib/aegis/types';

export const runtime = 'nodejs';

export async function GET() {
  const [policy, glossaryTerms] = await Promise.all([getActivePolicy(), getGlossaryTerms()]);
  return NextResponse.json({ policy, glossaryTerms, allEntityTypes: ALL_ENTITY_TYPES });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { action } = body as { action?: 'updatePolicy' | 'addTerm' | 'removeTerm' };

  if (action === 'addTerm') {
    const term = String(body.term ?? '');
    await addGlossaryTerm(term);
    // Mirror into the active policy's customGlossary field for detection.
    const policy = await getActivePolicy();
    if (!policy.customGlossary.includes(term.trim())) {
      await updateActivePolicy({ customGlossary: [...policy.customGlossary, term.trim()] });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === 'removeTerm') {
    const term = String(body.term ?? '');
    await removeGlossaryTerm(term);
    const policy = await getActivePolicy();
    await updateActivePolicy({
      customGlossary: policy.customGlossary.filter((t) => t !== term.trim()),
    });
    return NextResponse.json({ ok: true });
  }

  // default: updatePolicy
  const strictness = (body.strictness as Strictness) ?? undefined;
  const enabledEntityTypes = body.enabledEntityTypes as EntityType[] | undefined;
  const customGlossary = body.customGlossary as string[] | undefined;

  const patch: Partial<{ strictness: Strictness; enabledEntityTypes: EntityType[]; customGlossary: string[] }> = {};
  if (strictness && ['paranoid', 'balanced', 'permissive'].includes(strictness)) patch.strictness = strictness;
  if (Array.isArray(enabledEntityTypes)) patch.enabledEntityTypes = enabledEntityTypes;
  if (Array.isArray(customGlossary)) patch.customGlossary = customGlossary;

  const policy = await updateActivePolicy(patch);
  return NextResponse.json({ ok: true, policy });
}
