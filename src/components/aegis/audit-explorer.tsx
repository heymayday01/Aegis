'use client';

import * as React from 'react';
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
import { GlassPanel } from './glass-panel';
import { ScrollCard3D, ScrollReveal } from './scroll-card-3d';

interface AuditChainResponse {
  chain: AuditLogEntry[];
}

/**
 * AuditLogExplorer — the tamper-evidence demo, in liquid glass.
 *
 * Renders the hash-chained log as a vertical sequence of glass blocks with a
 * visible chain-link connector. Lets the user seed demo entries, tamper with
 * any entry (and watch the chain break downstream), repair the chain, or clear
 * it.
 */
export function AegisAuditExplorer() {
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
    <section id="audit" className="scroll-mt-20 py-12 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          num="03"
          eyebrow="Audit Log"
          title={
            <>
              Tamper-evident <br className="hidden sm:block" />
              <span className="italic text-muted-foreground">
                <span className="aegis-text-gradient">audit</span> chain.
              </span>
            </>
          }
          description="Every redaction is appended to a SHA-256 hash-chained log. Edit any entry and watch the chain break downstream — then repair it with one click. Only entity TYPES and COUNTS are stored, never the values themselves."
        />

        {/* Integrity summary + actions — floating glass panels */}
        <ScrollReveal
          delay={0.1}
          className="mt-6 sm:mt-10 grid gap-4 sm:grid-cols-[1fr_auto]"
        >
          {/* Integrity summary glass panel with left accent */}
          <GlassPanel
            liquid
            glare
            className={cn(
              'rounded-3xl p-4 sm:p-6 flex flex-wrap items-center gap-5 border-l-2',
              integrityOk ? 'border-l-primary' : 'border-l-destructive',
            )}
          >
            <div
              className={cn(
                'grid size-12 place-items-center rounded-2xl shrink-0',
                integrityOk
                  ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                  : 'bg-destructive/10 text-destructive ring-1 ring-destructive/30',
              )}
            >
              {integrityOk ? (
                <ShieldCheck className="size-6" />
              ) : (
                <ShieldAlert className="size-6" />
              )}
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
            {/* Stat row — entry count + entity count in big mono */}
            <div className="flex items-center gap-8">
              <div>
                <div className="aegis-eyebrow text-muted-foreground text-[9px]">
                  entries
                </div>
                <div className="aegis-mono text-3xl text-foreground leading-none mt-1">
                  {chain.length}
                </div>
              </div>
              <div>
                <div className="aegis-eyebrow text-muted-foreground text-[9px]">
                  entities
                </div>
                <div className="aegis-mono text-3xl text-foreground leading-none mt-1">
                  {totalEntities}
                </div>
              </div>
            </div>
          </GlassPanel>

          {/* Actions cell */}
          <GlassPanel className="rounded-3xl p-4 sm:p-6 flex flex-wrap items-center gap-2 justify-end">
            {chain.length === 0 && !loading && (
              <Button
                onClick={onSeed}
                disabled={busy !== null}
                className="h-10 rounded-full active:scale-[0.98]"
              >
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
                  variant="ghost"
                  size="sm"
                  onClick={onRepair}
                  disabled={busy !== null}
                  className="h-10 rounded-full hover:bg-foreground/5 active:scale-[0.98]"
                >
                  {busy === 'Chain repaired' ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="size-3.5" />
                  )}
                  Repair chain
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={load}
                  disabled={busy !== null}
                  className="h-10 rounded-full hover:bg-foreground/5 active:scale-[0.98]"
                >
                  <ScanLine className="size-3.5" />
                  Re-verify
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 rounded-full text-destructive hover:bg-destructive/10 active:scale-[0.98]"
                    >
                      <Trash2 className="size-3.5" />
                      Clear
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Clear the entire audit chain?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This wipes every entry permanently. The hash chain cannot
                        be reconstructed after this. Use this to start fresh.
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
          </GlassPanel>
        </ScrollReveal>

        {/* Chain visualization */}
        <div className="mt-8">
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-32 glass rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : chain.length === 0 ? (
            <EmptyState onSeed={onSeed} busy={busy} />
          ) : (
            <ScrollReveal>
              <ul className="space-y-3">
                {chain.map((entry, i) => (
                  <ChainBlock
                    key={entry.id}
                    entry={entry}
                    isLast={i === chain.length - 1}
                    onTamper={() => onTamper(entry.seq)}
                    busy={busy !== null}
                  />
                ))}
              </ul>
            </ScrollReveal>
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
    <GlassPanel className="rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center gap-3 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/30">
        <Link2 className="size-6" />
      </div>
      <div>
        <div className="text-sm font-semibold">No audit entries yet</div>
        <p className="mt-1 text-xs text-muted-foreground max-w-md">
          Seed a few demo entries to see the hash chain in action, or run a
          redaction in the playground above — every redaction with detections
          appends a real entry here automatically.
        </p>
      </div>
      <Button
        onClick={onSeed}
        disabled={busy !== null}
        className="mt-2 h-10 rounded-full active:scale-[0.98]"
      >
        {busy === 'Seeded demo entries' ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Database className="size-3.5" />
        )}
        Seed demo entries
      </Button>
    </GlassPanel>
  );
}

function ChainBlock({
  entry,
  isLast,
  onTamper,
  busy,
}: {
  entry: AuditLogEntry;
  isLast: boolean;
  onTamper: () => void;
  busy: boolean;
}) {
  const tampered = entry.tampered;
  return (
    <li className="relative pl-10">
      {/* Chain link connector */}
      {!isLast && (
        <div
          className={cn(
            'absolute left-[18px] top-8 bottom-0 w-0.5',
            tampered ? 'bg-destructive/40' : 'chain-link',
          )}
          aria-hidden
        />
      )}
      {/* Node dot */}
      <div
        className={cn(
          'absolute left-2 top-5 grid size-6 place-items-center rounded-full border-2',
          tampered
            ? 'border-destructive bg-destructive/15'
            : 'border-primary bg-primary/15',
        )}
      >
        <span
          className={cn(
            'size-2 rounded-full',
            tampered ? 'bg-destructive' : 'bg-primary',
          )}
        />
      </div>

      {/* 3D-scrolling glass block — tampered gets a red glow */}
      <ScrollCard3D intensity={6}>
        {/* Plain .glass (no liquid) per block — too many SVG filters would tank perf */}
        <div
          className={cn(
            'glass rounded-2xl p-4 sm:p-5',
            tampered && 'shadow-[0_0_30px_-5px] shadow-destructive/30 ring-1 ring-destructive/40',
          )}
        >
          {/* Header row */}
          <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-foreground/10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="aegis-mono text-[10px] sm:text-[11px] glass rounded-full px-2 py-0.5">
                #{String(entry.seq).padStart(3, '0')}
              </span>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground aegis-mono">
                {format(new Date(entry.timestamp), 'd MMM yyyy, HH:mm:ss')}
              </span>
              <span className="aegis-mono text-[10px] sm:text-[11px] glass rounded-full px-2 py-0.5 text-muted-foreground">
                {entry.destinationProvider}
              </span>
              {tampered && (
                <span className="inline-flex items-center gap-1 glass text-destructive rounded-full px-2 py-0.5 text-[10px] aegis-mono uppercase tracking-wider">
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
                  className="h-8 px-3 rounded-full text-[10px] sm:text-[11px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Hammer className="size-3" />
                  Tamper this
                </Button>
              )}
            </div>
          </div>

          {/* Entity chips row */}
          <div className="flex flex-wrap items-center gap-1.5 py-3 border-b border-foreground/10">
            {entry.entityTypesRedacted.length === 0 ? (
              <span className="text-xs text-muted-foreground italic">no entities</span>
            ) : (
              entry.entityTypesRedacted.map((type) => {
                const meta = ENTITY_META[type];
                const count = entry.entityCounts[type] ?? 0;
                return (
                  <span
                    key={type}
                    className={`entity-${type} entity-chip inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] sm:text-[11px]`}
                  >
                    {meta.label}
                    <span className="opacity-70">×{count}</span>
                  </span>
                );
              })
            )}
            <span className="ml-auto text-[10px] sm:text-[11px] text-muted-foreground aegis-mono">
              {entry.inputCharCount} chars in
            </span>
          </div>

          {/* Hashes */}
          <div className="grid gap-2 sm:gap-3 sm:grid-cols-2 mt-3">
            <HashRow label="prev" hash={entry.previousHash} />
            <HashRow label="curr" hash={entry.currentHash} highlight={!tampered} />
          </div>
        </div>
      </ScrollCard3D>
    </li>
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
    <div className="glass rounded-xl p-2 sm:p-3 flex items-center gap-2 min-w-0">
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
              'flex-1 min-w-0 truncate text-[10px] sm:text-[11px] aegis-mono cursor-help focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-0.5',
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
