import { NextRequest, NextResponse } from 'next/server';
import { getAuditChain, tamperEntry, repairChain, clearChain, appendAuditEntry } from '@/lib/aegis/audit';

export const runtime = 'nodejs';

export async function GET() {
  const chain = await getAuditChain();
  return NextResponse.json({ chain });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = body.action as string | undefined;

  if (action === 'tamper') {
    const seq = Number(body.seq);
    await tamperEntry(seq);
    const chain = await getAuditChain();
    return NextResponse.json({ ok: true, chain });
  }

  if (action === 'repair') {
    await repairChain();
    const chain = await getAuditChain();
    return NextResponse.json({ ok: true, chain });
  }

  if (action === 'clear') {
    await clearChain();
    return NextResponse.json({ ok: true, chain: [] });
  }

  if (action === 'seed') {
    // Seed a few demo entries so the dashboard isn't empty on first load.
    const demos = [
      { types: ['EMAIL', 'API_KEY'] as const, counts: { EMAIL: 1, API_KEY: 1 }, provider: 'openai', len: 184 },
      { types: ['AADHAAR', 'PAN'] as const, counts: { AADHAAR: 1, PAN: 1 }, provider: 'anthropic', len: 96 },
      { types: ['PHONE', 'IP_ADDRESS'] as const, counts: { PHONE: 1, IP_ADDRESS: 1 }, provider: 'gemini', len: 142 },
      { types: ['CREDIT_CARD'] as const, counts: { CREDIT_CARD: 1 }, provider: 'openai', len: 78 },
    ];
    for (const d of demos) {
      await appendAuditEntry({
        entityTypesRedacted: [...d.types] as any,
        entityCounts: d.counts,
        destinationProvider: d.provider,
        inputCharCount: d.len,
      });
    }
    const chain = await getAuditChain();
    return NextResponse.json({ ok: true, chain });
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
