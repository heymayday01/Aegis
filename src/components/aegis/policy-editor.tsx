'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Plus, X, Loader2, Sliders, BookMarked } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { EntityType, Policy, Strictness } from '@/lib/aegis/types';
import { ALL_ENTITY_TYPES, ENTITY_META } from '@/lib/aegis/types';
import { SectionHeading } from './section-heading';

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
    <section id="policy" className="scroll-mt-20 border-t border-border/60 bg-card/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
        <SectionHeading
          eyebrow="Policy Editor"
          title="Policy configuration"
          description="Changes here apply live to the playground and streaming demo. The active policy is persisted server-side and re-read on every detection call."
        />

        {loading || !policy ? (
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <Card className="border-border/70">
              <CardContent>
                <div className="space-y-3">
                  <div className="h-5 w-1/3 bg-muted animate-pulse rounded" />
                  <div className="h-10 w-full bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/70">
              <CardContent>
                <div className="space-y-3">
                  <div className="h-5 w-1/3 bg-muted animate-pulse rounded" />
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {/* Strictness */}
            <Card className="border-border/70">
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Sliders className="size-4 text-primary" />
                  <h3 className="text-sm font-semibold">Strictness</h3>
                </div>
                <div className="flex flex-col gap-2">
                  {(Object.keys(STRICTNESS_META) as Strictness[]).map((s) => {
                    const selected = policy.strictness === s;
                    return (
                      <button
                        key={s}
                        onClick={() => updateStrictness(s)}
                        disabled={busy}
                        aria-pressed={selected}
                        className={cn(
                          'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                          selected
                            ? 'border-primary/60 bg-primary/10 ring-1 ring-primary/30'
                            : 'border-border/60 bg-background/40 hover:border-border hover:bg-accent/30',
                        )}
                      >
                        <span
                          className={cn(
                            'mt-0.5 grid size-4 place-items-center rounded-full border-2 shrink-0',
                            selected ? 'border-primary' : 'border-muted-foreground/40',
                          )}
                        >
                          {selected && <span className="size-2 rounded-full bg-primary" />}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{STRICTNESS_META[s].label}</div>
                          <div className="text-xs text-muted-foreground leading-relaxed">
                            {STRICTNESS_META[s].desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-border/60 pt-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Entity type toggles</h3>
                    <span className="text-[11px] text-muted-foreground aegis-mono">
                      {policy.enabledEntityTypes.length}/{ALL_ENTITY_TYPES.length} on
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ALL_ENTITY_TYPES.map((type) => {
                      const meta = ENTITY_META[type];
                      const enabled = policy.enabledEntityTypes.includes(type);
                      return (
                        <div
                          key={type}
                          className={cn(
                            'flex items-center justify-between gap-3 rounded-md border px-3 py-2 transition-colors',
                            enabled
                              ? `entity-${type} border-border/70 bg-background/40`
                              : 'border-border/40 bg-background/20 opacity-60',
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`entity-${type} inline-block size-2.5 rounded-full shrink-0`}
                              style={{ background: 'var(--ec)' }}
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{meta.label}</div>
                              <div className="text-[11px] text-muted-foreground truncate">
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
              </CardContent>
            </Card>

            {/* Custom glossary */}
            <Card className="border-border/70">
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <BookMarked className="size-4 text-primary" />
                  <h3 className="text-sm font-semibold">Custom glossary</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Codenames, customer names, internal project labels. Matched
                  case-insensitively as whole words. Use the{' '}
                  <span className={`entity-CUSTOM_GLOSSARY entity-chip rounded px-1.5 py-0.5 text-[10px]`}>
                    Glossary
                  </span>{' '}
                  colour everywhere.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addTerm();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value)}
                    placeholder="e.g. Project Phoenix, Acme Corp, Codename Atlas"
                    disabled={busy}
                    className="h-9"
                  />
                  <Button type="submit" size="sm" disabled={busy || !newTerm.trim()} className="h-9">
                    {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                    Add
                  </Button>
                </form>

                <div className="border-t border-border/60 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      Current terms ({glossaryTerms.length})
                    </span>
                  </div>
                  {glossaryTerms.length === 0 ? (
                    <div className="rounded-md border border-dashed border-border/50 p-4 text-center text-xs text-muted-foreground">
                      No glossary terms yet. Add one above.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {glossaryTerms.map((term) => (
                        <span
                          key={term}
                          className={`entity-CUSTOM_GLOSSARY entity-chip inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs aegis-mono`}
                        >
                          {term}
                          <button
                            onClick={() => removeTerm(term)}
                            disabled={busy}
                            aria-label={`Remove ${term}`}
                            className="grid size-5 place-items-center rounded-sm hover:bg-destructive/20 hover:text-destructive transition-colors active:scale-[0.9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-auto rounded-md border border-primary/30 bg-primary/5 p-3 text-xs">
                  <span className="font-medium text-primary">Live:</span>{' '}
                  <span className="text-muted-foreground">
                    Changes apply immediately to the playground above and to streaming
                    detection. The server stores one active policy; future org-scoping is
                    documented in the architecture section.
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}

// Re-export for type parity.
export type { EntityType };
