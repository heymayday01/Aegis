import { NextRequest, NextResponse } from 'next/server';
import { detect } from '@/lib/aegis/detect';
import { getActivePolicy } from '@/lib/aegis/policy-store';
import type { Policy } from '@/lib/aegis/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const text = String(body.text ?? '');
  if (!text) return NextResponse.json({ detections: [] });

  // Allow caller to pass a policy override; otherwise use the stored active policy.
  let policy: Policy;
  if (body.policy) {
    policy = body.policy as Policy;
  } else {
    policy = await getActivePolicy();
  }

  const detections = detect(text, policy);
  return NextResponse.json({ detections, policy });
}
