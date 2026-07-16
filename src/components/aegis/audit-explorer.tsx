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

/**
 * AuditLogExplorer — the tamper-evidence demo.
 *
 * Renders the hash-chained log as a vertical sequence of hard-edged blocks
 * with a visible chain-link connector. Lets the user seed demo entries, tamper
 * with any entry (and watch the chain break downstream), repair the chain, or
 * clear it.
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
    <section id="audit" className="scroll-mt-20 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">
        <SectionHeading
          num="03"
          eyebrow="Audit Log Explorer"
          title={
            <>
              Tamper-evident <br className="hidden sm:block" />
              <span className="italic text-muted-foreground">audit chain.</span>
            </>
          }
          description="Every redaction is appended to a SHA-256 hash-chained log. Edit any entry and watch the chain break downstream — then repair it with one click. Only entity TYPES and COUNTS are stored, never the values themselves."
        />

        {/* Integrity summary + actions — hard-edged, hairline-divided */}
        <div className="mt-8 grid gap-px bg-border border border-border sm:grid-cols-[1fr_auto]">
          {/* Integrity summary card with left accent border */}
          <div
            className={cn(
              'bg-card p-5 flex flex-wrap items-center gap-5 border-l-2',
              integrityOk ? 'border-l-primary' : 'border-l-destructive',
            )}
          >
            <div
              className={cn(
                'grid size-10 place-items-center border shrink-0',
                integrityOk
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-destructive/30 bg-destructive/10 text-destructive',
              )}
            >
              {integrityOk ? <ShieldCheck className="size-5" /> : <ShieldAlert className="size-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="aegis-eyebrow text-muted-foreground mb-1">
                chain integrity
              </div>
              <div className="text-sm font-semibold">
                {integrityOk ? (
                  <span className="text-primary">✓ VERIFIED</span>
                ) : (
                  <span className="text-destructive">
                    ⚠ BROKEN at entry #{firstTampered?.seq}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-muted-foreground aegis-mono mt-0.5">
                {integrityOk ? 'all hashes match' : 'cascade failure downstream'}
              </div>
            </div>
            {/* Stat row — entry count + entity count in large mono */}
            <div className="flex items-center gap-6">
              <div>
                <div className="aegis-eyebrow text-muted-foreground text-[9px]">entries</div>
                <div className="aegis-mono text-2xl text-foreground leading-none mt-1">
                  {chain.length}
                </div>
              </div>
              <div>
                <div className="aegis-eyebrow text-muted-foreground text-[9px]">entities</div>
                <div className="aegis-mono text-2xl text-foreground leading-none mt-1">
                  {totalEntities}
                </div>
              </div>
            </div>
          </div>

          {/* Actions cell */}
          <div className="bg-card p-5 flex flex-wrap items-center gap-2 justify-end">
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
                  className="h-32 border border-border bg-card animate-pulse"
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
    <div className="border border-dashed border-border bg-card flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="grid size-12 place-items-center bg-primary/10 text-primary">
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
    </div>
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
  prefersReduced: boolean | null;
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

      {/* Hard-edged block — hairline-divided sections inside */}
      <div
        className={cn(
          'mb-3 border transition-colors',
          tampered
            ? 'border-destructive/50 bg-destructive/5'
            : 'border-border bg-card hover:border-foreground/20',
        )}
      >
        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="aegis-mono text-[11px] border border-border bg-background/40 px-1.5 py-0.5">
              #{String(entry.seq).padStart(3, '0')}
            </span>
            <span className="text-[11px] text-muted-foreground aegis-mono">
              {format(new Date(entry.timestamp), 'd MMM yyyy, HH:mm:ss')}
            </span>
            <span className="aegis-mono text-[11px] border border-border bg-background/40 px-1.5 py-0.5 text-muted-foreground">
              {entry.destinationProvider}
            </span>
            {tampered && (
              <span className="inline-flex items-center gap-1 border border-destructive text-destructive px-1.5 py-0.5 text-[10px] aegis-mono uppercase tracking-wider">
                <AlertTriangle className="size-3" />
                tampered
              </span>
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

        {/* Entity chips row */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border p-4">
          {entry.entityTypesRedacted.length === 0 ? (
            <span className="text-xs text-muted-foreground italic">no entities</span>
          ) : (
            entry.entityTypesRedacted.map((type) => {
              const meta = ENTITY_META[type];
              const count = entry.entityCounts[type] ?? 0;
              return (
                <span
                  key={type}
                  className={`entity-${type} entity-chip inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px]`}
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

        {/* Hashes — two-cell grid with hairline divider */}
        <div className="grid gap-px bg-border sm:grid-cols-2">
          <div className="bg-card p-4">
            <HashRow label="prev" hash={entry.previousHash} />
          </div>
          <div className="bg-card p-4">
            <HashRow label="curr" hash={entry.currentHash} highlight={!tampered} />
          </div>
        </div>
      </div>
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
      <span className="aegis-eyebrow text-muted-foreground w-8 shrink-0 text-[9px]">
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
              'flex-1 min-w-0 truncate text-[11px] aegis-mono cursor-help px-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              highlight ? 'text-primary' : 'text-muted-foreground',
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
