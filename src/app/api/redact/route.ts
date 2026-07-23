import { NextRequest, NextResponse } from 'next/server';
import { redact } from '@/lib/aegis/tokenize';
import { appendAuditEntry } from '@/lib/aegis/audit';
import { getActivePolicy } from '@/lib/aegis/policy-store';
import { validateText, rateLimit } from '@/lib/aegis/api-helpers';
import type { Policy, EntityType } from '@/lib/aegis/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // Rate limit
  const limited = rateLimit(req);
  if (limited) return limited;

  // Parse + validate
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validated = validateText(body);
  if (validated instanceof NextResponse) return validated;
  const { text } = validated;

  const destinationProvider = typeof body.destinationProvider === 'string'
    ? body.destinationProvider.slice(0, 50) // sanitize
    : 'openai';
  const logToAudit = body.logToAudit !== false;

  // Get policy (caller override or server default)
  let policy: Policy;
  if (body.policy && typeof body.policy === 'object') {
    policy = body.policy as Policy;
  } else {
    policy = await getActivePolicy();
  }

  try {
    const result = redact(text, policy);

    if (logToAudit && result.detections.length > 0) {
      const counts: Record<string, number> = {};
      const types = new Set<EntityType>();
      for (const d of result.detections) {
        counts[d.entityType] = (counts[d.entityType] ?? 0) + 1;
        types.add(d.entityType);
      }
      await appendAuditEntry({
        entityTypesRedacted: Array.from(types),
        entityCounts: counts,
        destinationProvider,
        inputCharCount: text.length,
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('Redact error:', err);
    return NextResponse.json(
      { error: 'Redaction failed', message: (err as Error).message },
      { status: 500 },
    );
  }
}
