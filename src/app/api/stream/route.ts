import { NextRequest } from 'next/server';
import { StreamingRedactor, SAMPLE_STREAM_PAYLOAD } from '@/lib/aegis/streaming';
import { getActivePolicy } from '@/lib/aegis/policy-store';

export const runtime = 'nodejs';
// SSE: keep the response alive as long as the stream runs.
export const dynamic = 'force-dynamic';

/**
 * GET /api/stream
 * Server-Sent Events endpoint that simulates an LLM streaming a response
 * token-by-token, with Aegis redacting PII live as it flows.
 *
 * Events:
 *   data: {"type":"chunk","output":"...","buffered":3,"detections":[...]}
 *   data: {"type":"done","tokenMap":{...}}
 */
export async function GET(req: NextRequest) {
  const policy = await getActivePolicy();
  const redactor = new StreamingRedactor(policy, 24);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      // Simulate token-by-token arrival: split the payload into small chunks,
      // some of which split PII entities across boundaries (to prove buffering works).
      const payload = SAMPLE_STREAM_PAYLOAD;
      const chunkSize = 8; // small enough to split entities across chunks
      const chunks: string[] = [];
      for (let i = 0; i < payload.length; i += chunkSize) {
        chunks.push(payload.slice(i, i + chunkSize));
      }

      for (const chunk of chunks) {
        const { output, buffered, completedDetections } = redactor.feed(chunk);
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
        // Pace the stream so the client can see it arriving live.
        await sleep(35);
      }

      const { output, completedDetections } = redactor.flush();
      if (output) {
        send({
          type: 'chunk',
          output,
          buffered: 0,
          completedDetections: completedDetections.map((d) => ({
            entityType: d.entityType,
            value: d.value,
            confidence: d.confidence,
          })),
        });
      }

      send({ type: 'done', tokenMap: redactor.getTokenMap() });
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
