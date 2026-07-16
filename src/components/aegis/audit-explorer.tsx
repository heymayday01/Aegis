'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Hammer,
  Link2,
  Loader2,
  Database,
  ScanLine,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { AuditLogEntry, EntityType } from '@/lib/aegis/types';
import { ENTITY_META } from '@/lib/aegis/types';
import { SectionHeading } from './section-heading';
import { truncateHash } from './masked-value';

interface AuditChainResponse {
  chain: AuditLogEntry[];
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  anthropic: 'border-orange-400/30 bg-orange-400/10 text-orange-300',
  gemini: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
};

function providerBadge(provider: string): string {
  return (
    PROVIDER_COLORS[provider] ?? 'border-border/70 bg-secondary text-secondary-foreground'
  );
}

/**
 * AuditLogExplorer — the tamper-evidence demo.
 *
 * Renders the hash-chained log as a vertical sequence of blocks with a visible
 * chain-link connector. Lets the user seed demo entries, tamper with any entry
 * (and watch the chain break downstream), repair the chain, or clear it.
 */
export function AegisAuditExplorer() {
  const prefersReduced = useReducedMotion();
  const [chain, setChain] = React.useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/audit');
      const data = (await r.json()) as AuditChainResponse;
      setChain(data.chain ?? []);
    } catch (e) {
      toast.error('Failed to load audit chain', { description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const post = async (body: Record<string, unknown>, label: string) => {
    setBusy(label);
    try {
      const r = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = (await r.json()) as AuditChainResponse;
      setChain(data.chain ?? []);
      toast.success(label);
    } catch (e) {
      toast.error(`${label} failed`, { description: (e as Error).message });
    } finally {
      setBusy(null);
    }
  };

  const onSeed = () => post({ action: 'seed' }, 'Seeded demo entries');
  const onRepair = () => post({ action: 'repair' }, 'Chain repaired');
  const onClear = () => post({ action: 'clear' }, 'Chain cleared');
  const onTamper = (seq: number) => {
    // B4 fix: tampering is a destructive/demo action, not a success.
    // Use a warning toast so the semantics are honest.
    post({ action: 'tamper', seq }, `Tampered entry #${seq}`);
    toast.warning(`Entry #${seq} corrupted`, {
      description: 'The hash chain is now broken downstream. Click Repair to fix.',
    });
  };

  const firstTampered = chain.find((e) => e.tampered);
  const integrityOk = !firstTampered;
  const totalEntities = chain.reduce(
    (sum, e) => sum + Object.values(e.entityCounts).reduce((a, b) => a + b, 0),
    0,
  );

  return (
    <section id="audit" className="scroll-mt-20 border-t border-border/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
        <SectionHeading
          eyebrow="Audit Log Explorer"
          title="Tamper-evident audit chain"
          description="Every redaction is appended to a SHA-256 hash-chained log. Edit any entry and watch the chain break downstream — then repair it with one click. Only entity TYPES and COUNTS are stored, never the values themselves."
        />

        {/* Integrity summary + actions */}
        <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto]">
          <Card
            className={cn(
              'border-l-2',
              integrityOk
                ? 'border-l-emerald-400/60 border-border/70'
                : 'border-l-destructive/70 border-border/70',
            )}
          >
            <CardContent className="flex flex-wrap items-center gap-4">
              <div
                className={cn(
                  'grid size-10 place-items-center rounded-md',
                  integrityOk
                    ? 'bg-emerald-400/10 text-emerald-300'
                    : 'bg-destructive/15 text-destructive',
                )}
              >
                {integrityOk ? <ShieldCheck className="size-5" /> : <ShieldAlert className="size-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">
                  Chain integrity:{' '}
                  {integrityOk ? (
                    <span className="text-emerald-300">✓ VERIFIED</span>
                  ) : (
                    <span className="text-destructive">
                      ⚠ BROKEN at entry #{firstTampered?.seq}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground aegis-mono mt-0.5">
                  {chain.length} entries · {totalEntities} entities redacted ·{' '}
                  {integrityOk ? 'all hashes match' : 'cascade failure downstream'}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center gap-2">
            {chain.length === 0 && !loading && (
              <Button onClick={onSeed} disabled={busy !== null} className="h-9">
                {busy === 'Seeded demo entries' ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Database className="size-3.5" />
                )}
                Seed demo entries
              </Button>
            )}
            {chain.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRepair}
                  disabled={busy !== null}
                  className="h-9"
                >
                  {busy === 'Chain repaired' ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="size-3.5" />
                  )}
                  Repair chain
                </Button>
                <Button variant="outline" size="sm" onClick={load} disabled={busy !== null} className="h-9">
                  <ScanLine className="size-3.5" />
                  Re-verify
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 text-destructive">
                      <Trash2 className="size-3.5" />
                      Clear
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear the entire audit chain?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This wipes every entry permanently. The hash chain cannot be
                        reconstructed after this. Use this to start fresh.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={onClear}
                        className="bg-destructive text-white hover:bg-destructive/90"
                      >
                        Clear chain
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>

        {/* Chain visualization */}
        <div className="mt-8">
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-32 rounded-xl border border-border/60 bg-card/40 animate-pulse"
                />
              ))}
            </div>
          ) : chain.length === 0 ? (
            <EmptyState onSeed={onSeed} busy={busy} />
          ) : (
            <div className="relative">
              {chain.map((entry, i) => (
                <ChainBlock
                  key={entry.id}
                  entry={entry}
                  isLast={i === chain.length - 1}
                  onTamper={() => onTamper(entry.seq)}
                  busy={busy !== null}
                  prefersReduced={prefersReduced}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function EmptyState({
  onSeed,
  busy,
}: {
  onSeed: () => void;
  busy: string | null;
}) {
  return (
    <Card className="border-dashed border-border/70">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
          <Link2 className="size-6" />
        </div>
        <div>
          <div className="text-sm font-semibold">No audit entries yet</div>
          <p className="mt-1 text-xs text-muted-foreground max-w-md">
            Seed a few demo entries to see the hash chain in action, or run a redaction
            in the playground above — every redaction with detections appends a real
            entry here automatically.
          </p>
        </div>
        <Button onClick={onSeed} disabled={busy !== null} className="mt-2 h-9">
          {busy === 'Seeded demo entries' ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Database className="size-3.5" />
          )}
          Seed demo entries
        </Button>
      </CardContent>
    </Card>
  );
}

function ChainBlock({
  entry,
  isLast,
  onTamper,
  busy,
  prefersReduced,
}: {
  entry: AuditLogEntry;
  isLast: boolean;
  onTamper: () => void;
  busy: boolean;
  prefersReduced: boolean;
}) {
  const tampered = entry.tampered;
  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="relative pl-8"
    >
      {/* Chain link connector */}
      {!isLast && (
        <div
          className={cn(
            'absolute left-[11px] top-4 bottom-0 w-0.5',
            tampered ? 'bg-destructive/40' : 'chain-link',
          )}
          aria-hidden
        />
      )}
      {/* Node dot */}
      <div
        className={cn(
          'absolute left-1.5 top-3 grid size-5 place-items-center rounded-full border-2',
          tampered
            ? 'border-destructive bg-destructive/15'
            : 'border-primary bg-primary/15',
        )}
      >
        <span
          className={cn(
            'size-1.5 rounded-full',
            tampered ? 'bg-destructive' : 'bg-primary',
          )}
        />
      </div>

      <Card
        className={cn(
          'mb-3 transition-colors',
          tampered
            ? 'border-destructive/50 bg-destructive/5'
            : 'border-border/70 hover:border-border',
        )}
      >
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="aegis-mono text-[11px] border-border/70 bg-secondary/40"
              >
                #{String(entry.seq).padStart(3, '0')}
              </Badge>
              <span className="text-xs text-muted-foreground aegis-mono">
                {format(new Date(entry.timestamp), 'd MMM yyyy, HH:mm:ss')}
              </span>
              <Badge
                variant="outline"
                className={cn('text-[11px]', providerBadge(entry.destinationProvider))}
              >
                {entry.destinationProvider}
              </Badge>
              {tampered && (
                <Badge variant="destructive" className="text-[10px]">
                  <AlertTriangle className="size-3" />
                  TAMPERED
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {!tampered && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onTamper}
                  disabled={busy}
                  className="h-8 px-2 text-[11px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Hammer className="size-3" />
                  Tamper this
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {entry.entityTypesRedacted.length === 0 ? (
              <span className="text-xs text-muted-foreground italic">no entities</span>
            ) : (
              entry.entityTypesRedacted.map((type) => {
                const meta = ENTITY_META[type];
                const count = entry.entityCounts[type] ?? 0;
                return (
                  <span
                    key={type}
                    className={`entity-${type} entity-chip inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px]`}
                  >
                    {meta.label}
                    <span className="opacity-70">×{count}</span>
                  </span>
                );
              })
            )}
            <span className="ml-auto text-[11px] text-muted-foreground aegis-mono">
              {entry.inputCharCount} chars in
            </span>
          </div>

          {/* Hashes */}
          <div className="grid gap-2 sm:grid-cols-2">
            <HashRow label="prev" hash={entry.previousHash} />
            <HashRow label="curr" hash={entry.currentHash} highlight={!tampered} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function HashRow({
  label,
  hash,
  highlight = false,
}: {
  label: string;
  hash: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground w-8 shrink-0">
        {label}
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* B3 fix: make the hash keyboard-focusable so screen reader + keyboard
              users can access the full hash via the tooltip. */}
          <span
            tabIndex={0}
            role="button"
            className={cn(
              'flex-1 min-w-0 truncate text-[11px] aegis-mono cursor-help rounded-sm px-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              highlight ? 'text-emerald-300' : 'text-muted-foreground',
            )}
          >
            {truncateHash(hash)}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-md break-all">
          {hash}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

// Re-export EntityType for type-only consumers (kept for parity with the API surface).
export type { EntityType };
