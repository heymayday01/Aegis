import { NextRequest } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { StreamingRedactor } from '@/lib/aegis/streaming';
import { getActivePolicy } from '@/lib/aegis/policy-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/stream-llm
 *
 * Real LLM streaming with live redaction.
 *
 * Request: { prompt: string }
 * Response: text/event-stream
 *   data: {"type":"chunk","output":"...","buffered":N,"detections":[...]}
 *   data: {"type":"done","tokenCount":N}
 *
 * The user's prompt is redacted FIRST (so PII never reaches the LLM), then
 * sent to the z-ai LLM. The LLM's streaming response is then run through
 * the StreamingRedactor so any PII echoed back in the response is also
 * redacted live as it arrives.
 *
 * If the LLM call fails (no API key, network, etc.), we fall back to a
 * canned response so the demo still works.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const prompt = String(body.prompt ?? '');
  if (!prompt.trim()) {
    return new Response(JSON.stringify({ error: 'prompt is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const policy = await getActivePolicy();
  const redactor = new StreamingRedactor(policy, 24);

  // Redact the user's prompt before sending to the LLM.
  const { redactedText: redactedPrompt } = redactor.feed(prompt);
  const flushed = redactor.flush();
  const safePrompt = redactedPrompt + flushed.output;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      let llmStream: AsyncIterable<unknown> | null = null;
      let usingFallback = false;

      try {
        const zai = await ZAI.create();
        const response: unknown = await zai.chat.completions.create({
          messages: [
            { role: 'assistant', content: 'You are a helpful assistant. Be concise.' },
            { role: 'user', content: safePrompt },
          ],
          stream: true,
          thinking: { type: 'disabled' },
        });
        llmStream = response as AsyncIterable<unknown>;
      } catch {
        usingFallback = true;
        send({ type: 'status', message: 'LLM unavailable — using fallback demo response' });
      }

      if (llmStream) {
        try {
          for await (const chunk of llmStream) {
            let text: string;
            if (typeof chunk === 'string') text = chunk;
            else if (chunk instanceof Uint8Array) text = new TextDecoder().decode(chunk);
            else text = JSON.stringify(chunk);

            const lines = text.split('\n');
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const delta = parsed?.choices?.[0]?.delta?.content;
                if (delta && typeof delta === 'string') {
                  const { output, buffered, completedDetections } = redactor.feed(delta);
                  send({
                    type: 'chunk',
                    output,
                    buffered,
                    completedDetections: completedDetections.map((d) => ({
                      entityType: d.entityType,
                      value: d.value,
                      confidence: d.confidence,
                    })),
                  });
                }
              } catch {
                // partial JSON, skip
              }
            }
          }
          const final = redactor.flush();
          if (final.output) {
            send({
              type: 'chunk',
              output: final.output,
              buffered: 0,
              completedDetections: final.completedDetections.map((d) => ({
                entityType: d.entityType,
                value: d.value,
                confidence: d.confidence,
              })),
            });
          }
          send({
            type: 'done',
            tokenCount: Object.keys(redactor.getTokenMap()).length,
            source: 'live-llm',
            redactedPrompt,
          });
        } catch (err) {
          send({ type: 'error', message: (err as Error).message });
        }
      } else if (usingFallback) {
        const fallback =
          'Sure! Here is the info you asked for. The primary contact is jane.doe@example.com ' +
          'and their backup is john.smith@company.io. The Stripe key is sk_live_51HqXyZabcDEF1234567890abcd. ' +
          'The customer Aadhaar is 234123412346 and PAN is ABCDE1234F. Office: +91 98765 43210. ' +
          'Server IP: 203.0.113.42. Card on file: 4111 1111 1111 1111. Let me know if you need anything else!';
        const chunkSize = 6;
        for (let i = 0; i < fallback.length; i += chunkSize) {
          const piece = fallback.slice(i, i + chunkSize);
          const { output, buffered, completedDetections } = redactor.feed(piece);
          send({
            type: 'chunk',
            output,
            buffered,
            completedDetections: completedDetections.map((d) => ({
              entityType: d.entityType,
              value: d.value,
              confidence: d.confidence,
            })),
          });
          await sleep(30);
        }
        const final = redactor.flush();
        if (final.output) {
          send({
            type: 'chunk',
            output: final.output,
            buffered: 0,
            completedDetections: final.completedDetections.map((d) => ({
              entityType: d.entityType,
              value: d.value,
              confidence: d.confidence,
            })),
          });
        }
        send({
          type: 'done',
          tokenCount: Object.keys(redactor.getTokenMap()).length,
          source: 'fallback',
          redactedPrompt,
        });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
