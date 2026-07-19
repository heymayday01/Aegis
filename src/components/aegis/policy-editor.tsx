'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Plus, X, Loader2, Sliders, BookMarked } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { EntityType, Policy, Strictness } from '@/lib/aegis/types';
import { ALL_ENTITY_TYPES, ENTITY_META } from '@/lib/aegis/types';
import { SectionHeading } from './section-heading';
import { GlassPanel } from './glass-panel';
import { ScrollCard3D, ScrollReveal } from './scroll-card-3d';

interface PolicyResponse {
  policy: Policy;
  glossaryTerms: string[];
  allEntityTypes: EntityType[];
}

const STRICTNESS_META: Record<
  Strictness,
  { label: string; desc: string }
> = {
  paranoid: {
    label: 'Paranoid',
    desc: 'Redact everything detected at confidence ≥ 0.5. Glossary always on.',
  },
  balanced: {
    label: 'Balanced',
    desc: 'Redact regex matches ≥ 0.8 + glossary. Flag the rest. (default)',
  },
  permissive: {
    label: 'Permissive',
    desc: 'Only high-confidence regex (≥ 0.95). Glossary off.',
  },
};

export function AegisPolicyEditor() {
  const [policy, setPolicy] = React.useState<Policy | null>(null);
  const [glossaryTerms, setGlossaryTerms] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [newTerm, setNewTerm] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/policy');
      const data = (await r.json()) as PolicyResponse;
      setPolicy(data.policy);
      setGlossaryTerms(data.glossaryTerms ?? []);
    } catch (e) {
      toast.error('Failed to load policy', { description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const updateStrictness = async (s: Strictness) => {
    if (!policy || policy.strictness === s) return;
    const next = { ...policy, strictness: s };
    setPolicy(next); // optimistic
    setBusy(true);
    try {
      const r = await fetch('/api/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strictness: s }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = (await r.json()) as { ok: true; policy?: Policy };
      if (data.policy) setPolicy(data.policy);
      toast.success(`Strictness: ${s}`);
    } catch (e) {
      toast.error('Update failed', { description: (e as Error).message });
      setPolicy(policy); // rollback
    } finally {
      setBusy(false);
    }
  };

  const toggleEntityType = async (type: EntityType, enabled: boolean) => {
    if (!policy) return;
    const current = new Set(policy.enabledEntityTypes);
    if (enabled) current.add(type);
    else current.delete(type);
    const nextTypes = ALL_ENTITY_TYPES.filter((t) => current.has(t));
    const next = { ...policy, enabledEntityTypes: nextTypes };
    setPolicy(next); // optimistic
    setBusy(true);
    try {
      const r = await fetch('/api/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabledEntityTypes: nextTypes }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      toast.success(`${ENTITY_META[type].label} ${enabled ? 'enabled' : 'disabled'}`);
    } catch (e) {
      toast.error('Update failed', { description: (e as Error).message });
      setPolicy(policy); // rollback
    } finally {
      setBusy(false);
    }
  };

  const addTerm = async () => {
    const t = newTerm.trim();
    if (!t) return;
    if (glossaryTerms.includes(t)) {
      toast('Term already exists', { description: `"${t}" is already in the glossary.` });
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addTerm', term: t }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setNewTerm('');
      await load();
      toast.success(`Added "${t}" to glossary`);
    } catch (e) {
      toast.error('Add failed', { description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const removeTerm = async (term: string) => {
    setBusy(true);
    try {
      const r = await fetch('/api/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'removeTerm', term }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await load();
      toast.success(`Removed "${term}"`);
    } catch (e) {
      toast.error('Remove failed', { description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="policy" className="scroll-mt-20 py-12 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          num="04"
          eyebrow="Policy"
          title={
            <>
              Policy <br className="hidden sm:block" />
              <span className="italic text-muted-foreground">
                <span className="aegis-text-gradient">configuration.</span>
              </span>
            </>
          }
          description="Changes here apply live to the playground and streaming demo. The active policy is persisted server-side and re-read on every detection call."
        />

        {loading || !policy ? (
          <div className="mt-6 sm:mt-10 grid gap-4 lg:grid-cols-2">
            <div className="glass rounded-3xl p-4 sm:p-6 space-y-3">
              <div className="h-5 w-1/3 bg-foreground/10 animate-pulse rounded-full" />
              <div className="h-10 w-full bg-foreground/5 animate-pulse rounded-2xl" />
            </div>
            <div className="glass rounded-3xl p-4 sm:p-6 space-y-3">
              <div className="h-5 w-1/3 bg-foreground/10 animate-pulse rounded-full" />
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 bg-foreground/5 animate-pulse rounded-xl"
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <ScrollReveal
            delay={0.1}
            className="mt-6 sm:mt-10 grid gap-4 lg:grid-cols-2"
          >
            {/* Strictness + entity toggles — left panel */}
            <GlassPanel className="rounded-3xl p-4 sm:p-6 flex flex-col">
              {/* Strictness radio cards */}
              <div className="pb-6 border-b border-foreground/10">
                <div className="flex items-center gap-2 mb-4">
                  <Sliders className="size-4 text-primary" />
                  <h3 className="aegis-eyebrow text-muted-foreground">Strictness</h3>
                </div>
                <div className="flex flex-col gap-2">
                  {(Object.keys(STRICTNESS_META) as Strictness[]).map((s) => {
                    const selected = policy.strictness === s;
                    return (
                      <ScrollCard3D key={s} intensity={8}>
                        <button
                          onClick={() => updateStrictness(s)}
                          disabled={busy}
                          aria-pressed={selected}
                          className={cn(
                            'glass flex items-start gap-3 rounded-2xl p-3 sm:p-4 text-left transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-full',
                            selected
                              ? 'ring-2 ring-primary bg-primary/5'
                              : 'hover:ring-1 hover:ring-foreground/15',
                          )}
                        >
                          <span
                            className={cn(
                              'mt-0.5 grid size-5 place-items-center rounded-full border-2 shrink-0',
                              selected ? 'border-primary' : 'border-muted-foreground/40',
                            )}
                          >
                            {selected && (
                              <span className="size-2.5 rounded-full bg-primary" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm font-medium">
                              {STRICTNESS_META[s].label}
                            </div>
                            <div className="text-xs text-muted-foreground leading-relaxed">
                              {STRICTNESS_META[s].desc}
                            </div>
                          </div>
                        </button>
                      </ScrollCard3D>
                    );
                  })}
                </div>
              </div>

              {/* Entity type toggles — 2-col on mobile for compactness */}
              <div className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="aegis-eyebrow text-muted-foreground">Entity types</h3>
                  <span className="text-[11px] text-muted-foreground aegis-mono">
                    {policy.enabledEntityTypes.length}/{ALL_ENTITY_TYPES.length} on
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_ENTITY_TYPES.map((type) => {
                    const meta = ENTITY_META[type];
                    const enabled = policy.enabledEntityTypes.includes(type);
                    return (
                      <div
                        key={type}
                        className={cn(
                          'glass rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-2 transition-opacity',
                          !enabled && 'opacity-60',
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`entity-${type} entity-dot inline-block size-2.5 rounded-full shrink-0`}
                          />
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-medium truncate">
                              {meta.label}
                            </div>
                            <div className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                              {meta.description}
                            </div>
                          </div>
                        </div>
                        <Switch
                          checked={enabled}
                          onCheckedChange={(v) => toggleEntityType(type, v)}
                          disabled={busy}
                          aria-label={`Toggle ${meta.label}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </GlassPanel>

            {/* Custom glossary — right panel */}
            <GlassPanel className="rounded-3xl p-4 sm:p-6 flex flex-col">
              <div className="pb-6 border-b border-foreground/10">
                <div className="flex items-center gap-2 mb-3">
                  <BookMarked className="size-4 text-primary" />
                  <h3 className="aegis-eyebrow text-muted-foreground">
                    Custom glossary
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Codenames, customer names, internal project labels. Matched
                  case-insensitively as whole words. Uses the{' '}
                  <span className="entity-CUSTOM_GLOSSARY entity-chip rounded-lg px-1.5 py-0.5 text-[10px] aegis-mono">
                    Glossary
                  </span>{' '}
                  colour everywhere.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addTerm();
                  }}
                  className="mt-4 flex gap-2"
                >
                  <Input
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value)}
                    placeholder="e.g. Project Phoenix, Acme Corp, Codename Atlas"
                    disabled={busy}
                    className="h-9 rounded-full"
                  />
                  <Button
                    type="submit"
                    variant="glass-primary"
                    size="sm-pill"
                    disabled={busy || !newTerm.trim()}
                  >
                    {busy ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Plus className="size-3.5" />
                    )}
                    Add
                  </Button>
                </form>
              </div>

              <div className="pt-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="aegis-eyebrow text-muted-foreground">
                    Current terms ({glossaryTerms.length})
                  </span>
                </div>
                {glossaryTerms.length === 0 ? (
                  <div className="glass rounded-2xl p-4 text-center text-xs text-muted-foreground">
                    No glossary terms yet. Add one above.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {glossaryTerms.map((term) => (
                      <span
                        key={term}
                        className="entity-CUSTOM_GLOSSARY entity-chip inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs aegis-mono"
                      >
                        {term}
                        <button
                          onClick={() => removeTerm(term)}
                          disabled={busy}
                          aria-label={`Remove ${term}`}
                          className="grid size-5 place-items-center rounded-full hover:bg-destructive/20 hover:text-destructive transition-colors active:scale-[0.9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* // live — comment-style note, mono */}
                <div className="mt-auto pt-4 border-t border-foreground/10 text-[11px] text-muted-foreground leading-relaxed">
                  <span className="text-foreground/80 aegis-mono">{'// live'}</span>
                  <br />
                  Changes apply immediately to the playground above and to
                  streaming detection. The server stores one active policy;
                  future org-scoping is documented in the architecture section.
                </div>
              </div>
            </GlassPanel>
          </ScrollReveal>
        )}
      </div>
    </section>
  );
}

// Re-export for type parity.
export type { EntityType };
