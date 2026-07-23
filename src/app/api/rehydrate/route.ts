import { NextRequest, NextResponse } from 'next/server';
import { rehydrate } from '@/lib/aegis/tokenize';
import { rateLimit } from '@/lib/aegis/api-helpers';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const redactedText = typeof body.redactedText === 'string' ? body.redactedText : '';
  const tokenMap = (body.tokenMap && typeof body.tokenMap === 'object')
    ? body.tokenMap as Record<string, string>
    : {};

  if (!redactedText) {
    return NextResponse.json({ error: 'redactedText must be a non-empty string' }, { status: 400 });
  }

  if (redactedText.length > 100_000) {
    return NextResponse.json({ error: 'redactedText exceeds maximum length' }, { status: 413 });
  }

  try {
    const original = rehydrate(redactedText, tokenMap);
    return NextResponse.json({ original });
  } catch (err) {
    console.error('Rehydrate error:', err);
    return NextResponse.json(
      { error: 'Rehydration failed', message: (err as Error).message },
      { status: 500 },
    );
  }
}
