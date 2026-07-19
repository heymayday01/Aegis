'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  Sparkles,
  Eraser,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type {
  DetectionResult,
  EntityType,
  Policy,
  Strictness,
} from '@/lib/aegis/types';
import { ENTITY_META } from '@/lib/aegis/types';
import { SectionHeading } from './section-heading';
import { EntityChip } from './entity-chip';
import { GlassPanel } from './glass-panel';
import { ScrollReveal } from './scroll-card-3d';

const SAMPLE_TEXT = `Hi team — onboarding the new customer from Acme Corp.

Primary contact: john.doe@acme.com, backup: sara.devops@acme.io.
Their Stripe live key is sk_live_51HqXyZabcDEF1234567890abcd and the Google
API key is AIzaSyA1234567890abcdefghijklmnopqrstuv. The customer’s Aadhaar is
234123412346 and PAN is ABCDE1234F. Office line: +91 98765 43210.
The Project Phoenix server IP is 203.0.113.42. Card on file:
4111 1111 1111 1111. Please don't share these beyond the team.`;

const STRICTNESS_OPTIONS: { value: Strictness; label: string; desc: string }[] = [
  { value: 'paranoid', label: 'Paranoid', desc: 'Redact everything ≥ 0.5 + glossary' },
  { value: 'balanced', label: 'Balanced', desc: 'Redact regex ≥ 0.8 + glossary (default)' },
  { value: 'permissive', label: 'Permissive', desc: 'Only high-conf ≥ 0.95, glossary off' },
];

interface RedactResponse {
  redactedText: string;
  tokenMap: Record<string, string>;
  detections: DetectionResult[];
}

interface PolicyResponse {
  policy: Policy;
  glossaryTerms: string[];
  allEntityTypes: EntityType[];
}

/**
 * Playground — the main attraction. Two liquid-glass columns: input | output.
 * Live-highlights detections in the source text and renders a rehydration proof.
 */
export function AegisPlayground() {
  const [text, setText] = React.useState(SAMPLE_TEXT);
  const [strictness, setStrictness] = React.useState<Strictness>('balanced');
  const [loading, setLoading] = React.useState(false);
  const [rehydrating, setRehydrating] = React.useState(false);
  const [result, setResult] = React.useState<RedactResponse | null>(null);
  const [policy, setPolicy] = React.useState<Policy | null>(null);
  const [rehydrated, setRehydrated] = React.useState<string | null>(null);
  const [roundTripOk, setRoundTripOk] = React.useState<boolean | null>(null);
  const [copied, setCopied] = React.useState(false);

  // Hydrate the active policy so the strictness selector reflects server truth.
  React.useEffect(() => {
    let cancelled = false;
    fetch('/api/policy')
      .then((r) => r.json() as Promise<PolicyResponse>)
      .then((data) => {
        if (!cancelled && data?.policy) {
          setPolicy(data.policy);
          setStrictness(data.policy.strictness);
        }
      })
      .catch(() => {
        /* non-fatal — defaults stay */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Refresh policy from server when strictness changes (so toggles stay in sync
  // with the Policy Editor section).
  const refreshPolicy = React.useCallback(async () => {
    try {
      const r = await fetch('/api/policy');
      const data = (await r.json()) as PolicyResponse;
      if (data?.policy) {
        setPolicy(data.policy);
        setStrictness(data.policy.strictness);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Build a policy override to send with redact so the local selector wins
  // without mutating the server's stored policy.
  const buildPolicyOverride = React.useCallback((): Policy => {
    const base: Policy = policy ?? {
      strictness,
      enabledEntityTypes: [
        'EMAIL',
        'API_KEY',
        'PHONE',
        'CREDIT_CARD',
        'AADHAAR',
        'PAN',
        'IP_ADDRESS',
        'CUSTOM_GLOSSARY',
      ],
      customGlossary: [],
    };
    return { ...base, strictness };
  }, [policy, strictness]);

  // B1 fix: clear stale result when the user edits the input text.
  // Old detections have indices that no longer match the new text, so
  // highlights would be misaligned. Force a re-redact.
  const onTextChange = (v: string) => {
    setText(v);
    if (result) {
      setResult(null);
      setRehydrated(null);
      setRoundTripOk(null);
    }
  };

  // U1: Cmd/Ctrl+Enter triggers redact from the textarea.
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onRedact();
    }
  };

  const onRedact = async () => {
    if (!text.trim()) {
      toast.error('Nothing to redact', { description: 'Paste some text first.' });
      return;
    }
    setLoading(true);
    setResult(null);
    setRehydrated(null);
    setRoundTripOk(null);
    try {
      const r = await fetch('/api/redact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          destinationProvider: 'openai',
          logToAudit: true,
          policy: buildPolicyOverride(),
        }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = (await r.json()) as RedactResponse;
      setResult(data);
      if (data.detections.length === 0) {
        toast('No entities detected', { description: 'Clean text — nothing to redact.' });
      } else {
        toast.success(`Redacted ${data.detections.length} entities`, {
          description: 'Token map held client-side only.',
        });
      }
    } catch (e) {
      toast.error('Redaction failed', { description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const onRehydrate = async () => {
    if (!result) return;
    setRehydrating(true);
    setRehydrated(null);
    setRoundTripOk(null);
    try {
      const r = await fetch('/api/rehydrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          redactedText: result.redactedText,
          tokenMap: result.tokenMap,
        }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = (await r.json()) as { original: string };
      setRehydrated(data.original);
      setRoundTripOk(data.original === text);
      if (data.original === text) {
        toast.success('Round-trip verified', {
          description: 'rehydrate(redact(x)) === x ✓',
        });
      } else {
        toast.error('Round-trip mismatch', {
          description: 'Rehydrated output differs from input.',
        });
      }
    } catch (e) {
      toast.error('Rehydration failed', { description: (e as Error).message });
    } finally {
      setRehydrating(false);
    }
  };

  const onCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.redactedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success('Copied redacted text');
    } catch {
      toast.error('Clipboard blocked', {
        description: 'Copy manually from the panel.',
      });
    }
  };

  return (
    <section id="playground" className="scroll-mt-20 py-12 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          num="01"
          eyebrow="Live Playground"
          title={
            <>
              Paste your prompt. <br className="hidden sm:block" />
              <span className="italic text-muted-foreground">
                Watch the <span className="aegis-text-gradient">PII</span> vanish.
              </span>
            </>
          }
          description="Every detection is highlighted in place, swapped for a reversible token, and logged in the audit chain. Edit the text or change strictness — the live policy is yours."
        />

        {/* Strictness pill bar + actions */}
        <ScrollReveal
          delay={0.05}
          className="mt-6 sm:mt-10 flex flex-wrap items-center gap-3 justify-between"
        >
          <div className="glass inline-flex items-center rounded-full p-1 gap-0.5">
            {STRICTNESS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStrictness(opt.value)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  strictness === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                title={opt.desc}
                aria-pressed={strictness === opt.value}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="glass"
              size="sm-pill"
              onClick={refreshPolicy}
              title="Reload policy from server"
            >
              <RefreshCw className="size-3.5" />
              Sync
            </Button>
            <Button
              variant="glass"
              size="sm-pill"
              onClick={() => setText(SAMPLE_TEXT)}
            >
              <Sparkles className="size-3.5" />
              Sample
            </Button>
            <Button
              variant="glass"
              size="sm-pill"
              onClick={() => {
                setText('');
                setResult(null);
                setRehydrated(null);
              }}
            >
              <Eraser className="size-3.5" />
              Clear
            </Button>
          </div>
        </ScrollReveal>

        <ScrollReveal
          delay={0.1}
          className="mt-6 grid gap-4 lg:grid-cols-2"
        >
          {/* LEFT: input + highlight preview */}
          <GlassPanel liquid glare className="rounded-3xl p-4 sm:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-foreground/10">
              <span className="aegis-eyebrow text-muted-foreground">Input</span>
              <span className="text-[11px] text-muted-foreground aegis-mono">
                {text.length} chars
              </span>
            </div>
            <Textarea
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              onKeyDown={onKeyDown}
              rows={8}
              spellCheck={false}
              className="mt-4 min-h-40 resize-y aegis-mono text-[13px] leading-relaxed border-0 bg-transparent focus-visible:ring-0 p-0 placeholder:text-muted-foreground/60"
              placeholder="Paste anything containing PII — emails, keys, cards, Aadhaar, PAN, IPs, your codenames…"
            />
            <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>
                <kbd className="rounded-full border border-foreground/15 bg-foreground/5 px-1.5 py-0.5 text-[9px] aegis-mono">
                  ⌘/Ctrl
                </kbd>{' '}
                +{' '}
                <kbd className="rounded-full border border-foreground/15 bg-foreground/5 px-1.5 py-0.5 text-[9px] aegis-mono">
                  ↵
                </kbd>{' '}
                to redact
              </span>
              <span className="aegis-mono">{strictness}</span>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2 pt-3 border-t border-foreground/10">
                <span className="aegis-eyebrow text-muted-foreground">
                  Highlighted preview
                </span>
                {result && result.detections.length > 0 && (
                  <span className="text-[11px] text-primary aegis-mono">
                    {result.detections.length} found
                  </span>
                )}
              </div>
              <div className="glass rounded-2xl p-3 text-[13px] leading-relaxed aegis-mono whitespace-pre-wrap break-words min-h-24 max-h-72 overflow-y-auto">
                {result && result.detections.length > 0 ? (
                  <HighlightedText text={text} detections={result.detections} />
                ) : (
                  <span className="text-muted-foreground">
                    {loading
                      ? 'Detecting…'
                      : 'Run “Redact” to highlight entities in this text.'}
                  </span>
                )}
              </div>
            </div>

            <Button
              variant="glass-primary"
              size="lg-pill"
              onClick={onRedact}
              disabled={loading || !text.trim()}
              className="mt-4 self-start group"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Redacting…
                </>
              ) : (
                <>
                  <Wand2 className="size-4 transition-transform group-hover:rotate-12" />
                  Redact
                </>
              )}
            </Button>
          </GlassPanel>

          {/* RIGHT: redacted output */}
          <GlassPanel liquid glare className="rounded-3xl p-4 sm:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-foreground/10">
              <span className="aegis-eyebrow text-muted-foreground">
                Redacted output
              </span>
              <div className="flex items-center gap-1.5">
                {result && Object.keys(result.tokenMap).length > 0 && (
                  <span className="aegis-mono text-[10px] text-muted-foreground glass rounded-full px-2 py-0.5">
                    {Object.keys(result.tokenMap).length} tokens
                  </span>
                )}
                <Button
                  variant="glass"
                  size="icon-sm"
                  onClick={onCopy}
                  disabled={!result}
                  title="Copy redacted text"
                  aria-label="Copy redacted text"
                >
                  {copied ? (
                    <Check className="size-3.5 text-primary" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </Button>
              </div>
            </div>

            <div className="glass rounded-2xl p-3 mt-4 text-[13px] leading-relaxed aegis-mono whitespace-pre-wrap break-words min-h-44 max-h-72 overflow-y-auto">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ) : result ? (
                <RenderedRedacted text={result.redactedText} />
              ) : (
                <span className="text-muted-foreground">
                  Redacted output appears here. Tokens like{' '}
                  <span className="aegis-token entity-chip entity-EMAIL">
                    [AEGIS:EMAIL:A1B2]
                  </span>{' '}
                  stand in for real values — they restore 1:1 on rehydration.
                </span>
              )}
            </div>

            {/* Detection chips */}
            {result && result.detections.length > 0 && (
              <div className="mt-4">
                <span className="aegis-eyebrow text-muted-foreground">
                  Detected entities
                </span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {result.detections.map((d, i) => (
                    <EntityChip
                      key={`${d.entityType}-${i}`}
                      type={d.entityType}
                      value={d.value}
                      confidence={d.confidence}
                      className="rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Rehydrate */}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-foreground/10 pt-4">
              <Button
                variant="glass"
                size="sm-pill"
                onClick={onRehydrate}
                disabled={!result || rehydrating}
              >
                {rehydrating ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5" />
                )}
                Rehydrate
              </Button>
              {roundTripOk === true && (
                <span className="inline-flex items-center gap-1.5 rounded-full glass text-primary px-2.5 py-1 text-[11px] aegis-mono">
                  <ShieldCheck className="size-3" />
                  Round-trip ✓ verified
                </span>
              )}
              {roundTripOk === false && (
                <span className="inline-flex items-center gap-1.5 rounded-full glass text-destructive px-2.5 py-1 text-[11px] aegis-mono">
                  <AlertTriangle className="size-3" />
                  Round-trip ✗ mismatch
                </span>
              )}
            </div>

            {rehydrated !== null && (
              <div className="mt-4">
                <span className="aegis-eyebrow text-muted-foreground">
                  Rehydrated original
                </span>
                <div className="glass mt-2 rounded-2xl p-3 text-[13px] leading-relaxed aegis-mono whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                  {rehydrated}
                </div>
              </div>
            )}
          </GlassPanel>
        </ScrollReveal>
      </div>
    </section>
  );
}

/**
 * Render the source text with detection spans wrapped in colored underline spans.
 * Walks detections in order (sorted by startIndex), splicing plain text between.
 */
function HighlightedText({
  text,
  detections,
}: {
  text: string;
  detections: DetectionResult[];
}) {
  const sorted = [...detections].sort((a, b) => a.startIndex - b.startIndex);
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  for (let i = 0; i < sorted.length; i++) {
    const d = sorted[i];
    if (d.startIndex < cursor) continue; // skip overlaps (paranoid mode can produce them)
    if (d.startIndex > cursor) {
      nodes.push(<span key={`p-${i}`}>{text.slice(cursor, d.startIndex)}</span>);
    }
    nodes.push(
      <span
        key={`d-${i}`}
        className={`entity-underline entity-${d.entityType}`}
        title={`${ENTITY_META[d.entityType].label} · ${(d.confidence * 100).toFixed(0)}% · ${d.source}`}
      >
        {text.slice(d.startIndex, d.endIndex)}
      </span>,
    );
    cursor = d.endIndex;
  }
  if (cursor < text.length) {
    nodes.push(<span key="tail">{text.slice(cursor)}</span>);
  }
  return <>{nodes}</>;
}

/**
 * Render redacted output, colorizing tokens like `[AEGIS:EMAIL:A1B2]` with the
 * matching entity color chip.
 */
function RenderedRedacted({ text }: { text: string }) {
  const parts = text.split(/(\[AEGIS:[A-Z_]+:[0-9A-F]+\])/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\[AEGIS:([A-Z_]+):([0-9A-F]+)\]$/);
        if (m) {
          const type = m[1] as EntityType;
          return (
            <span
              key={i}
              className={`aegis-token entity-chip entity-${type}`}
              title={`Redacted ${ENTITY_META[type]?.label ?? type}`}
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
