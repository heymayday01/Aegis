'use client';

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { Play, Square, Radio, Loader2, CheckCircle2, Gauge, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ENTITY_META, type EntityType } from '@/lib/aegis/types';
import { SectionHeading } from './section-heading';
import { EntityChip } from './entity-chip';

interface StreamChunkEvent {
  type: 'chunk';
  output: string;
  buffered: number;
  completedDetections: {
    entityType: EntityType;
    value: string;
    confidence: number;
  }[];
}
interface StreamDoneEvent {
  type: 'done';
  tokenMap: Record<string, string>;
}
type StreamEvent = StreamChunkEvent | StreamDoneEvent;

/**
 * Streaming-aware redaction demo.
 *
 * Connects to `/api/stream` via EventSource and shows:
 *   - the redacted stream arriving live in a monospace panel
 *   - a "buffering" indicator whenever `buffered > 0`
 *   - a running count + chips of completed detections
 *   - the final token map size when the stream completes
 */
export function AegisStreamingDemo() {
  const prefersReduced = useReducedMotion();
  const [streaming, setStreaming] = React.useState(false);
  const [output, setOutput] = React.useState('');
  const [buffered, setBuffered] = React.useState(0);
  const [completed, setCompleted] = React.useState<
    { entityType: EntityType; value: string; confidence: number }[]
  >([]);
  const [done, setDone] = React.useState(false);
  const [tokenCount, setTokenCount] = React.useState(0);

  const sourceRef = React.useRef<EventSource | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);

  // B2 fix: auto-scroll the container directly during streaming.
  // Using scrollIntoView({behavior:'smooth'}) on every chunk (~35ms) caused
  // janky, laggy scrolling because smooth-scroll animations queue up.
  // Instead we set scrollTop directly — instant, no animation queue.
  React.useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [output, streaming]);

  const cleanup = React.useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.close();
      sourceRef.current = null;
    }
    setStreaming(false);
  }, []);

  React.useEffect(() => () => cleanup(), [cleanup]);

  const start = () => {
    if (streaming) return;
    setOutput('');
    setBuffered(0);
    setCompleted([]);
    setDone(false);
    setTokenCount(0);
    setStreaming(true);

    const source = new EventSource('/api/stream');
    sourceRef.current = source;
    // Local flag so the error handler doesn't read stale React state.
    let isDone = false;

    source.onmessage = (ev) => {
      let data: StreamEvent;
      try {
        data = JSON.parse(ev.data) as StreamEvent;
      } catch {
        return;
      }
      if (data.type === 'chunk') {
        if (data.output) {
          setOutput((prev) => prev + data.output);
        }
        setBuffered(data.buffered ?? 0);
        if (data.completedDetections?.length) {
          setCompleted((prev) => [...prev, ...data.completedDetections]);
        }
      } else if (data.type === 'done') {
        isDone = true;
        setTokenCount(Object.keys(data.tokenMap ?? {}).length);
        setBuffered(0);
        setDone(true);
        setStreaming(false);
        source.close();
        sourceRef.current = null;
        toast.success('Stream complete', {
          description: `${Object.keys(data.tokenMap ?? {}).length} entities redacted in flight.`,
        });
      }
    };

    source.onerror = () => {
      // EventSource fires `error` after a clean server-side close (we already
      // handled `done`); only treat as fatal if we never saw `done` and the
      // source is genuinely closed.
      if (isDone) return;
      if (source.readyState === EventSource.CLOSED) {
        setStreaming(false);
        source.close();
        sourceRef.current = null;
        toast.error('Stream closed unexpectedly');
      }
    };
  };

  const stop = () => {
    cleanup();
    toast('Stream stopped', { description: 'EventSource closed by user.' });
  };

  const totalRedacted = completed.length;

  return (
    <section id="streaming" className="scroll-mt-20 border-t border-border/60 bg-card/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
        <SectionHeading
          eyebrow="Streaming Demo"
          title="Streaming-aware redaction"
          description="LLM responses stream token-by-token. A PII entity like john@acme.com can be split across chunk boundaries (john@ac | me.com). Aegis holds back a sliding window and redacts live as the stream flows — no broken tokens, no missed entities."
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_280px]">
          {/* Stream output panel */}
          <Card className="border-border/70">
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Radio className={cn('size-4', streaming ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    Live stream
                  </span>
                  {streaming && (
                    <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                      <span className="size-1.5 rounded-full bg-primary aegis-live-dot" />
                      streaming
                    </Badge>
                  )}
                  {done && (
                    <Badge variant="outline" className="border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                      <CheckCircle2 className="size-3" />
                      complete
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!streaming ? (
                    <Button size="sm" onClick={start} disabled={streaming} className="h-9 active:scale-[0.98]">
                      <Play className="size-3.5" />
                      {done ? 'Replay stream' : 'Start stream'}
                    </Button>
                  ) : (
                    <Button size="sm" variant="destructive" onClick={stop} className="h-9 active:scale-[0.98]">
                      <Square className="size-3.5" />
                      Stop
                    </Button>
                  )}
                </div>
              </div>

              {/* Buffering indicator */}
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs transition-colors',
                    buffered > 0
                      ? 'border-amber-400/40 bg-amber-400/10 text-amber-300'
                      : 'border-border/60 bg-background/50 text-muted-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'size-1.5 rounded-full',
                      buffered > 0 ? 'bg-amber-400 aegis-live-dot' : 'bg-muted-foreground/40',
                    )}
                  />
                  {buffered > 0 ? (
                    <span className="aegis-mono">
                      buffering · <span className="font-semibold">{buffered}</span> chars held
                    </span>
                  ) : (
                    <span className="aegis-mono">buffer empty</span>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  The sliding window holds ambiguous tails until PII can be confirmed.
                </span>
              </div>

              {/* Output */}
              <div ref={scrollContainerRef} className="relative rounded-md border border-border/60 bg-background/60 p-3 min-h-64 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap break-words text-[13px] leading-relaxed aegis-mono text-foreground/90">
                  {output || (
                    <span className="text-muted-foreground">
                      Press <span className="text-primary">“Start stream”</span> to simulate an
                      LLM response arriving token-by-token. Watch PII get redacted live.
                    </span>
                  )}
                  {streaming && (
                    <span
                      className="inline-block w-[0.5em] h-[1.1em] ml-0.5 align-text-bottom bg-primary/70 animate-pulse"
                      style={{ transform: 'translateY(2px)' }}
                    />
                  )}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Live side panel: counts + chips */}
          <Card className="border-border/70">
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Live stats
                </span>
                {streaming ? (
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                ) : done ? (
                  <CheckCircle2 className="size-3.5 text-emerald-300" />
                ) : (
                  <Gauge className="size-3.5 text-muted-foreground" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Stat label="Redacted" value={totalRedacted} accent />
                <Stat label="Tokens" value={tokenCount} />
                <Stat label="Buffered" value={buffered} />
                <Stat label="Output" value={output.length} suffix=" chars" />
              </div>

              <div className="border-t border-border/60 pt-3">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Entities redacted in flight
                </span>
                <div className="mt-2 flex flex-wrap gap-1.5 min-h-10">
                  <AnimatePresence mode="popLayout">
                    {completed.length === 0 && !streaming && (
                      <span className="text-[11px] text-muted-foreground">
                        Detected entities appear here as the stream flows.
                      </span>
                    )}
                    {completed.map((d, i) => (
                      <motion.div
                        key={`${d.entityType}-${i}-${d.value}`}
                        initial={prefersReduced ? false : { opacity: 0, scale: 0.7, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                      >
                        <EntityChip
                          type={d.entityType}
                          value={d.value}
                          confidence={d.confidence}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {done && (
                <div className="rounded-md border border-emerald-400/30 bg-emerald-400/5 p-3 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-medium">
                    <CheckCircle2 className="size-3.5" />
                    Stream complete
                  </div>
                  <div className="mt-1.5 text-muted-foreground aegis-mono leading-relaxed">
                    tokens: {tokenCount}
                    <br />
                    entities: {totalRedacted}
                    <br />
                    integrity: <span className="text-emerald-300">✓ round-trip ready</span>
                  </div>
                </div>
              )}

              <div className="mt-auto text-[11px] text-muted-foreground leading-relaxed border-t border-border/60 pt-3">
                <span className="text-foreground/80">How it works:</span>{' '}
                Aegis runs detection on each chunk against the sliding window buffer.
                Confirmed-safe text flushes immediately; ambiguous tails are held.
                When an entity completes, a token replaces it in-flight.
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-1.5 border-t border-border/60 pt-3">
                {Object.entries(ENTITY_META).slice(0, 5).map(([type, meta]) => (
                  <span
                    key={type}
                    className={`entity-${type} entity-chip inline-flex items-center rounded px-1.5 py-0.5 text-[10px]`}
                  >
                    {meta.label}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  suffix = '',
  accent = false,
}: {
  label: string;
  value: number;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-md border border-border/60 bg-background/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn('text-lg font-semibold aegis-mono', accent && 'text-primary')}>
        {value}
        <span className="text-[10px] text-muted-foreground font-normal">{suffix}</span>
      </div>
    </div>
  );
}
