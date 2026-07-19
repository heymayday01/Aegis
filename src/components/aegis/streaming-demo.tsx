'use client';

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { Play, Square, Loader2, CheckCircle2, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ENTITY_META, type EntityType } from '@/lib/aegis/types';
import { SectionHeading } from './section-heading';
import { EntityChip } from './entity-chip';
import { GlassPanel } from './glass-panel';
import { ScrollReveal } from './scroll-card-3d';

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
 *   - the redacted stream arriving live in a monospace terminal panel
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
    <section id="streaming" className="scroll-mt-20 py-12 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          num="02"
          eyebrow="Streaming Demo"
          title={
            <>
              Redaction that keeps up <br className="hidden sm:block" />
              <span className="italic text-muted-foreground">
                with the <span className="aegis-text-gradient">stream.</span>
              </span>
            </>
          }
          description="LLM responses arrive token-by-token. A PII entity like john@acme.com can split across chunk boundaries (john@ac | me.com). Aegis holds back a sliding window and redacts live as the stream flows — no broken tokens, no missed entities."
        />

        <ScrollReveal
          delay={0.1}
          className="mt-6 sm:mt-10 grid gap-4 lg:grid-cols-[1fr_300px]"
        >
          {/* Stream output panel — terminal feel */}
          <GlassPanel className="rounded-3xl overflow-hidden flex flex-col">
            {/* Header bar with traffic-light dots + URL + status badges */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-foreground/10">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-destructive/60" />
                  <span className="size-2.5 rounded-full bg-amber-400/60" />
                  <span className="size-2.5 rounded-full bg-primary/60" />
                </div>
                <span className="aegis-eyebrow text-muted-foreground ml-1">
                  aegis://stream
                </span>
                {streaming && (
                  <span className="inline-flex items-center gap-1.5 glass text-primary rounded-full px-2 py-0.5 text-[10px] aegis-mono">
                    <span className="size-1.5 rounded-full bg-primary aegis-live-dot" />
                    LIVE
                  </span>
                )}
                {done && (
                  <span className="inline-flex items-center gap-1 glass text-primary rounded-full px-2 py-0.5 text-[10px] aegis-mono">
                    <CheckCircle2 className="size-3" />
                    COMPLETE
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!streaming ? (
                  <Button
                    variant="glass-primary"
                    size="md-pill"
                    onClick={start}
                    disabled={streaming}
                  >
                    <Play className="size-3.5" />
                    {done ? 'Replay' : 'Start stream'}
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    size="md-pill"
                    onClick={stop}
                  >
                    <Square className="size-3.5" />
                    Stop
                  </Button>
                )}
              </div>
            </div>

            {/* Buffering indicator bar */}
            <div className="flex items-center gap-3 px-5 py-2.5 border-b border-foreground/10">
              <div
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] transition-colors',
                  buffered > 0
                    ? 'glass text-amber-300'
                    : 'glass text-muted-foreground',
                )}
              >
                <span
                  className={cn(
                    'size-1.5 rounded-full',
                    buffered > 0
                      ? 'bg-amber-400 aegis-live-dot'
                      : 'bg-muted-foreground/40',
                  )}
                />
                <span className="aegis-mono">
                  {buffered > 0 ? (
                    <>
                      buffering · <span className="font-semibold">{buffered}</span>{' '}
                      held
                    </>
                  ) : (
                    'buffer empty'
                  )}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground hidden sm:block">
                The sliding window holds ambiguous tails until PII can be confirmed.
              </span>
            </div>

            {/* Output — terminal with scanlines */}
            <div
              ref={scrollContainerRef}
              className="relative aegis-scanlines bg-background/40 p-5 min-h-72 max-h-[28rem] overflow-y-auto"
            >
              <pre className="whitespace-pre-wrap break-words text-[13px] leading-relaxed aegis-mono text-foreground/90">
                {output || (
                  <span className="text-muted-foreground">
                    <span className="text-primary">$</span> press{' '}
                    <span className="text-primary">“Start stream”</span> to simulate
                    an LLM response arriving token-by-token. Watch PII get redacted
                    live.
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
          </GlassPanel>

          {/* Live side panel: counts + chips */}
          <GlassPanel className="rounded-3xl p-4 sm:p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-foreground/10">
              <span className="aegis-eyebrow text-muted-foreground">Live stats</span>
              {streaming ? (
                <Loader2 className="size-3.5 animate-spin text-primary" />
              ) : done ? (
                <CheckCircle2 className="size-3.5 text-primary" />
              ) : (
                <Gauge className="size-3.5 text-muted-foreground" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Stat label="Redacted" value={totalRedacted} accent />
              <Stat label="Tokens" value={tokenCount} />
              <Stat label="Buffered" value={buffered} />
              <Stat label="Chars" value={output.length} />
            </div>

            <div className="pt-3 border-t border-foreground/10">
              <span className="aegis-eyebrow text-muted-foreground">In flight</span>
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
                        className="rounded-lg"
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {done && (
              <div className="glass rounded-2xl p-3 text-xs">
                <div className="flex items-center gap-1.5 text-primary font-medium">
                  <CheckCircle2 className="size-3.5" />
                  Stream complete
                </div>
                <div className="mt-1.5 text-muted-foreground aegis-mono leading-relaxed">
                  tokens: {tokenCount}
                  <br />
                  entities: {totalRedacted}
                  <br />
                  integrity: <span className="text-primary">✓ round-trip ready</span>
                </div>
              </div>
            )}

            <div className="mt-auto text-[11px] text-muted-foreground leading-relaxed pt-3 border-t border-foreground/10">
              <span className="text-foreground/80 aegis-mono">{'// how it works'}</span>
              <br />
              Aegis runs detection on each chunk against the sliding window buffer.
              Confirmed-safe text flushes immediately; ambiguous tails are held. When
              an entity completes, a token replaces it in-flight.
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-foreground/10">
              {Object.entries(ENTITY_META).slice(0, 5).map(([type, meta]) => (
                <span
                  key={type}
                  className={`entity-${type} entity-chip inline-flex items-center rounded-lg px-1.5 py-0.5 text-[10px]`}
                >
                  {meta.label}
                </span>
              ))}
            </div>
          </GlassPanel>
        </ScrollReveal>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="glass rounded-xl p-3">
      <div className="aegis-eyebrow text-muted-foreground text-[9px]">{label}</div>
      <div
        className={cn(
          'text-2xl font-semibold aegis-mono mt-1 leading-none',
          accent && 'text-primary',
        )}
      >
        {value}
      </div>
    </div>
  );
}
