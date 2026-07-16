import { NextRequest, NextResponse } from 'next/server';
import { redact } from '@/lib/aegis/tokenize';
import { appendAuditEntry } from '@/lib/aegis/audit';
import { getActivePolicy } from '@/lib/aegis/policy-store';
import type { Policy, EntityType } from '@/lib/aegis/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const text = String(body.text ?? '');
  const destinationProvider = String(body.destinationProvider ?? 'openai');
  const logToAudit = body.logToAudit !== false; // default true

  if (!text) return NextResponse.json({ redactedText: '', tokenMap: {}, detections: [] });

  let policy: Policy;
  if (body.policy) {
    policy = body.policy as Policy;
  } else {
    policy = await getActivePolicy();
  }

  const result = redact(text, policy);

  if (logToAudit && result.detections.length > 0) {
    // Build entity counts + unique types. NEVER store values.
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
}
