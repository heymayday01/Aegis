import { NextRequest, NextResponse } from 'next/server';
import { rehydrate } from '@/lib/aegis/tokenize';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const redactedText = String(body.redactedText ?? '');
  const tokenMap = (body.tokenMap as Record<string, string>) ?? {};

  const original = rehydrate(redactedText, tokenMap);
  return NextResponse.json({ original });
}
