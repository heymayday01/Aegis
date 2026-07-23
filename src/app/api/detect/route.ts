import { NextRequest, NextResponse } from 'next/server';
import { detect } from '@/lib/aegis/detect';
import { getActivePolicy } from '@/lib/aegis/policy-store';
import { validateText, rateLimit } from '@/lib/aegis/api-helpers';
import type { Policy } from '@/lib/aegis/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validated = validateText(body);
  if (validated instanceof NextResponse) return validated;
  const { text } = validated;

  let policy: Policy;
  if (body.policy && typeof body.policy === 'object') {
    policy = body.policy as Policy;
  } else {
    policy = await getActivePolicy();
  }

  try {
    const detections = detect(text, policy);
    return NextResponse.json({ detections, policy });
  } catch (err) {
    console.error('Detect error:', err);
    return NextResponse.json(
      { error: 'Detection failed', message: (err as Error).message },
      { status: 500 },
    );
  }
}
