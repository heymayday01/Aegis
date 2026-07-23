import { NextRequest, NextResponse } from 'next/server';
import { redact } from '@/lib/aegis/tokenize';
import { appendAuditEntry } from '@/lib/aegis/audit';
import { getActivePolicy } from '@/lib/aegis/policy-store';
import { rateLimit } from '@/lib/aegis/api-helpers';
import type { Policy, EntityType } from '@/lib/aegis/types';

export const runtime = 'nodejs';

/**
 * POST /api/batch-redact
 *
 * Batch redaction — process multiple texts in a single request.
 * Request: { texts: string[], destinationProvider?: string, logToAudit?: boolean }
 * Response: { results: Array<{ redactedText, tokenMap, detections }> }
 *
 * This is the "enterprise" API — for processing chat logs, email archives,
 * document batches, etc. in one call. Each text gets its own token map
 * (no cross-contamination of tokens between items).
 *
 * Rate limited: counts as 1 request regardless of batch size (up to 50 items).
 */
export async function POST(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const texts = body.texts;
  if (!Array.isArray(texts)) {
    return NextResponse.json({ error: 'texts must be an array of strings' }, { status: 400 });
  }

  if (texts.length === 0) {
    return NextResponse.json({ error: 'texts must not be empty' }, { status: 400 });
  }

  if (texts.length > 50) {
    return NextResponse.json({ error: 'Maximum 50 items per batch' }, { status: 413 });
  }

  for (let i = 0; i < texts.length; i++) {
    if (typeof texts[i] !== 'string') {
      return NextResponse.json({ error: `Item ${i} must be a string` }, { status: 400 });
    }
    if (texts[i].length > 100_000) {
      return NextResponse.json({ error: `Item ${i} exceeds maximum length` }, { status: 413 });
    }
  }

  const destinationProvider = typeof body.destinationProvider === 'string'
    ? body.destinationProvider.slice(0, 50)
    : 'openai';
  const logToAudit = body.logToAudit !== false;

  let policy: Policy;
  if (body.policy && typeof body.policy === 'object') {
    policy = body.policy as Policy;
  } else {
    policy = await getActivePolicy();
  }

  try {
    const results = texts.map((text: string) => redact(text, policy));

    if (logToAudit && results.some((r) => r.detections.length > 0)) {
      const counts: Record<string, number> = {};
      const types = new Set<EntityType>();
      let totalChars = 0;
      results.forEach((r, i) => {
        totalChars += texts[i].length;
        for (const d of r.detections) {
          counts[d.entityType] = (counts[d.entityType] ?? 0) + 1;
          types.add(d.entityType);
        }
      });
      await appendAuditEntry({
        entityTypesRedacted: Array.from(types),
        entityCounts: counts,
        destinationProvider,
        inputCharCount: totalChars,
      });
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error('Batch redact error:', err);
    return NextResponse.json(
      { error: 'Batch redaction failed', message: (err as Error).message },
      { status: 500 },
    );
  }
}
