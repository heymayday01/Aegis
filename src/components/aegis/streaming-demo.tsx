'use client';

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { Play, Square, Loader2, CheckCircle2, Gauge, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ENTITY_META, type EntityType } from '@/lib/aegis/types';
import { SectionHeading } from './section-heading';
import { EntityChip } from './entity-chip';
import { GlassPanel } from './glass-panel';
import { ScrollReveal } from './scroll-card-3d';
import { LiquidGlassToggle } from './liquid-glass-toggle';

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
  tokenCount?: number;
  tokenMap?: Record<string, string>;
  source?: string;
  redactedPrompt?: string;
}
interface StreamStatusEvent {
  type: 'status';
  message: string;
}
interface StreamErrorEvent {
  type: 'error';
  message: string;
}
type StreamEvent = StreamChunkEvent | StreamDoneEvent | StreamStatusEvent | StreamErrorEvent;

type Mode = 'demo' | 'live';

const SAMPLE_PROMPT = 'Tell me about the new customer from Acme Corp. Their email is jane.doe@example.com and their API key is sk_live_51HqXyZabcDEF1234567890abcd.';

/**
 * Streaming-aware redaction demo.
 *
 * Two modes:
 *   - "Demo" — simulated stream via GET /api/stream (always works)
 *   - "Live LLM" — real z-ai LLM via POST /api/stream-llm (redacts prompt,
 *     sends to LLM, redacts the response stream)
 *
 * Shows the redacted stream arriving live, a buffering indicator, and
 * completed detection chips.
 */
export function AegisStreamingDemo() {
  const prefersReduced = useReducedMotion();
  const [mode, setMode] = React.useState<Mode>('demo');
  const [prompt, setPrompt] = React.useState(SAMPLE_PROMPT);
  const [streaming, setStreaming] = React.useState(false);
  const [output, setOutput] = React.useState('');
  const [buffered, setBuffered] = React.useState(0);
  const [completed, setCompleted] = React.useState<
    { entityType: EntityType; value: string; confidence: number }[]
  >([]);
  const [done, setDone] = React.useState(false);
  const [tokenCount, setTokenCount] = React.useState(0);
  const [source, setSource] = React.useState<string>('');
  const [redactedPrompt, setRedactedPrompt] = React.useState<string>('');

  const abortRef = React.useRef<AbortController | null>(null);
  const eventSourceRef = React.useRef<EventSource | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);
  const promptRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Auto-resize the prompt textarea to fit its content (no clipping).
  React.useEffect(() => {
    const el = promptRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, [prompt, mode]);

  React.useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [output, streaming]);

  const cleanup = React.useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setStreaming(false);
  }, []);

  React.useEffect(() => () => cleanup(), [cleanup]);

  const handleEvent = (data: StreamEvent) => {
    if (data.type === 'status') {
      toast.info(data.message);
    } else if (data.type === 'chunk') {
      if (data.output) setOutput((prev) => prev + data.output);
      setBuffered(data.buffered ?? 0);
      if (data.completedDetections?.length) {
        setCompleted((prev) => [...prev, ...data.completedDetections]);
      }
    } else if (data.type === 'done') {
      setTokenCount(data.tokenCount ?? Object.keys(data.tokenMap ?? {}).length);
      setBuffered(0);
      setDone(true);
      setStreaming(false);
      if (data.source) setSource(data.source);
      if (data.redactedPrompt) setRedactedPrompt(data.redactedPrompt);
      toast.success('Stream complete', {
        description: `${data.tokenCount ?? Object.keys(data.tokenMap ?? {}).length} entities redacted in flight.`,
      });
    } else if (data.type === 'error') {
      toast.error('Stream error', { description: data.message });
      setStreaming(false);
    }
  };

  const startDemo = () => {
    setOutput('');
    setBuffered(0);
    setCompleted([]);
    setDone(false);
    setTokenCount(0);
    setSource('');
    setRedactedPrompt('');
    setStreaming(true);

    const es = new EventSource('/api/stream');
    eventSourceRef.current = es;

    es.onmessage = (ev) => {
      try {
        handleEvent(JSON.parse(ev.data) as StreamEvent);
      } catch {
        // skip
      }
    };
    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) {
        setStreaming(false);
      }
    };
  };

  const startLive = async () => {
    setOutput('');
    setBuffered(0);
    setCompleted([]);
    setDone(false);
    setTokenCount(0);
    setSource('');
    setRedactedPrompt('');
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/stream-llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done: readerDone, value } = await reader.read();
        if (readerDone) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';
        for (const block of lines) {
          const line = block.trim();
          if (!line.startsWith('data: ')) continue;
          try {
            handleEvent(JSON.parse(line.slice(6)) as StreamEvent);
          } catch {
            // partial
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast.error('Live LLM failed', { description: (err as Error).message });
      }
      setStreaming(false);
    }
  };

  const start = () => {
    if (streaming) return;
    if (mode === 'live') startLive();
    else startDemo();
  };

  const stop = () => {
    cleanup();
    toast('Stream stopped');
  };

  const totalRedacted = completed.length;

  return (
    <section id="streaming" className="scroll-mt-20 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          num="02"
          eyebrow="Streaming Demo"
          title={
            <>
              Redaction that keeps up <br className="hidden sm:block" />
              <span className="text-muted-foreground/70">with the stream.</span>
            </>
          }
          description="LLM responses arrive token-by-token. Aegis holds back a sliding window and redacts live as the stream flows. Try the live LLM mode — your prompt is redacted before it reaches the model, and the response is redacted as it arrives."
        />

        <ScrollReveal delay={0.1} className="mt-6 sm:mt-10 grid gap-4 lg:grid-cols-[1fr_300px]">
          {/* Stream output panel — terminal feel */}
          <GlassPanel className="rounded-3xl overflow-hidden flex flex-col">
            {/* Header bar with mode toggle */}
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
                  <span className="inline-flex items-center gap-1.5 border border-primary/30 bg-primary/10 px-1.5 py-0.5 rounded text-[10px] text-primary aegis-mono">
                    <span className="size-1.5 rounded-full bg-primary aegis-live-dot" />
                    LIVE
                  </span>
                )}
                {done && (
                  <span className="inline-flex items-center gap-1 border border-primary/30 bg-primary/10 px-1.5 py-0.5 rounded text-[10px] text-primary aegis-mono">
                    <CheckCircle2 className="size-3" />
                    COMPLETE
                  </span>
                )}
              </div>

              {/* Mode toggle — premium liquid glass */}
              <LiquidGlassToggle
                size="sm"
                value={mode}
                onChange={(v) => setMode(v as Mode)}
                options={[
                  { value: 'demo', label: 'Demo', icon: <Zap className="size-3" /> },
                  { value: 'live', label: 'Live LLM', icon: <Sparkles className="size-3" /> },
                ]}
              />
            </div>

            {/* Prompt input (live mode only) — auto-resizes to fit content */}
            {mode === 'live' && (
              <div className="px-5 py-3 border-b border-foreground/10">
                <label className="aegis-eyebrow text-muted-foreground block mb-1.5">
                  Your prompt (redacted before sending)
                </label>
                <textarea
                  ref={promptRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  spellCheck={false}
                  rows={1}
                  className="w-full aegis-mono text-[12px] resize-none border-0 bg-transparent focus-visible:outline-none focus-visible:ring-0 p-0 min-h-[44px] overflow-hidden leading-relaxed"
                  placeholder="Type a prompt containing PII…"
                  disabled={streaming}
                />
              </div>
            )}

            {/* Buffering indicator bar */}
            <div className="flex items-center gap-3 border-b border-foreground/10 px-5 py-2.5">
              <div
                className={cn(
                  'inline-flex items-center gap-2 border px-2 py-1 text-[11px] rounded-sm transition-colors',
                  buffered > 0
                    ? 'border-amber-400/40 bg-amber-400/10 text-amber-300'
                    : 'border-border bg-background/50 text-muted-foreground',
                )}
              >
                <span
                  className={cn(
                    'size-1.5 rounded-full',
                    buffered > 0 ? 'bg-amber-400 aegis-live-dot' : 'bg-muted-foreground/40',
                  )}
                />
                <span className="aegis-mono">
                  {buffered > 0 ? (
                    <>buffering · <span className="font-semibold">{buffered}</span> held</>
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
            <div ref={scrollContainerRef} className="relative aegis-scanlines bg-background/80 p-5 min-h-64 max-h-80 overflow-y-auto">
              <pre className="whitespace-pre-wrap break-words text-[13px] leading-relaxed aegis-mono text-foreground/90">
                {output || (
                  <span className="text-muted-foreground">
                    <span className="text-primary">$</span> press{" "}
                    <span className="text-primary">“Start”</span> to {mode === 'live' ? 'send your prompt to the LLM' : 'simulate a stream'}.
                    Watch PII get redacted live.
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

            {/* Action bar */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-foreground/10">
              <div className="flex items-center gap-2">
                {!streaming ? (
                  <Button variant="glass-primary" size="md-pill" onClick={start} disabled={streaming}>
                    <Play className="size-3.5" />
                    {done ? 'Replay' : 'Start'}
                  </Button>
                ) : (
                  <Button variant="destructive" size="md-pill" onClick={stop}>
                    <Square className="size-3.5" />
                    Stop
                  </Button>
                )}
              </div>
              {source && (
                <span className="text-[10px] text-muted-foreground aegis-mono">
                  source: {source === 'live-llm' ? '✦ live LLM' : 'simulated'}
                </span>
              )}
            </div>
          </GlassPanel>

          {/* Live side panel: counts + chips */}
          <GlassPanel className="rounded-3xl p-4 sm:p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-foreground/10 pb-3">
              <span className="aegis-eyebrow text-muted-foreground">
                Live stats
              </span>
              {streaming ? (
                <Loader2 className="size-3.5 animate-spin text-primary" />
              ) : done ? (
                <CheckCircle2 className="size-3.5 text-primary" />
              ) : (
                <Gauge className="size-3.5 text-muted-foreground" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-px bg-foreground/8 border border-foreground/8 rounded-lg overflow-hidden">
              <Stat label="Redacted" value={totalRedacted} accent />
              <Stat label="Tokens" value={tokenCount} />
              <Stat label="Buffered" value={buffered} />
              <Stat label="Chars" value={output.length} />
            </div>

            {redactedPrompt && mode === 'live' && (
              <div className="border border-primary/20 bg-primary/5 rounded-lg p-2.5">
                <div className="aegis-eyebrow text-primary mb-1">Prompt sent to LLM</div>
                <div className="text-[10px] text-muted-foreground aegis-mono leading-relaxed max-h-20 overflow-y-auto break-words">
                  {redactedPrompt}
                </div>
              </div>
            )}

            <div className="border-t border-foreground/10 pt-3">
              <span className="aegis-eyebrow text-muted-foreground">
                In flight
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
              <div className="border border-primary/30 bg-primary/5 p-3 text-xs rounded-sm">
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

            <div className="mt-auto text-[11px] text-muted-foreground leading-relaxed border-t border-foreground/10 pt-3">
              <span className="text-foreground/80 aegis-mono">{'// how it works'}</span>
              <br />
              Aegis runs detection on each chunk against the sliding window buffer.
              Confirmed-safe text flushes immediately; ambiguous tails are held.
              When an entity completes, a token replaces it in-flight.
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-1.5 border-t border-foreground/10 pt-3">
              {Object.entries(ENTITY_META).slice(0, 5).map(([type, meta]) => (
                <span
                  key={type}
                  className={`entity-${type} entity-chip inline-flex items-center rounded px-1.5 py-0.5 text-[10px]`}
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
    <div className="bg-card px-3 py-2.5">
      <div className="aegis-eyebrow text-muted-foreground text-[9px]">{label}</div>
      <div className={cn('text-xl font-semibold aegis-mono mt-0.5', accent && 'text-primary')}>
        {value}
      </div>
    </div>
  );
}
