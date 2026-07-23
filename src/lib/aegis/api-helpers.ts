import { NextRequest, NextResponse } from 'next/server';

/**
 * Production hardening utilities for Aegis API routes.
 *
 * - validateText: ensures input is a non-empty string within size limits
 * - rateLimit: simple in-memory rate limiter (per IP, per minute)
 * - errorResponse: consistent error shape
 */

const MAX_INPUT_LENGTH = 100_000; // 100KB text limit
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute per IP

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Validate that the request body contains a usable text string.
 * Returns { text } on success, or a NextResponse (error) on failure.
 */
export function validateText(body: unknown): { text: string } | NextResponse {
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const text = (body as Record<string, unknown>).text;
  if (typeof text !== 'string') {
    return NextResponse.json({ error: 'text must be a string' }, { status: 400 });
  }

  if (text.length === 0) {
    return NextResponse.json({ error: 'text must not be empty' }, { status: 400 });
  }

  if (text.length > MAX_INPUT_LENGTH) {
    return NextResponse.json(
      { error: `text exceeds maximum length of ${MAX_INPUT_LENGTH} characters` },
      { status: 413 },
    );
  }

  return { text };
}

/**
 * Simple in-memory rate limiter. Returns null if allowed, or a NextResponse (429) if rate-limited.
 * Tracks per-IP request count in a rolling window.
 */
export function rateLimit(req: NextRequest): NextResponse | null {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  const now = Date.now();

  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again in a minute.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)) },
      },
    );
  }

  return null;
}

/**
 * Wrap an async handler with rate limiting + error handling.
 * Catches any uncaught errors and returns a consistent 500 response.
 */
export function withHardening(
  handler: (req: NextRequest) => Promise<NextResponse>,
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest) => {
    try {
      const limited = rateLimit(req);
      if (limited) return limited;

      return await handler(req);
    } catch (err) {
      console.error('API error:', err);
      return NextResponse.json(
        { error: 'Internal server error', message: (err as Error).message },
        { status: 500 },
      );
    }
  };
}
