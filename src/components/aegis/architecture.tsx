'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Plug,
  ScanFace,
  Radio,
  ShieldCheck,
  ArrowRight,
  ArrowLeftRight,
  Check,
  X,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionHeading } from './section-heading';
import { GlassPanel } from './glass-panel';
import { ScrollCard3D, ScrollReveal } from './scroll-card-3d';

const RELIABLY_CATCHES = [
  'Emails (RFC-ish, high precision)',
  'API keys: AWS (AKIA…), Google (AIza…), Stripe (sk_live_…/sk_test_…), GitHub (ghp_…/gho_…), Slack (xoxb-…), generic high-entropy secrets',
  'Phone numbers (E.164 + India mobile)',
  'Credit cards (Luhn-validated, major brands)',
  'Aadhaar (12-digit, Verhoeff-validated)',
  'PAN (Indian Permanent Account Number)',
  'IPv4 + IPv6 addresses',
  'Custom glossary terms (exact, case-insensitive, whole-word)',
];

const CANNOT_RELIABLY_CATCH = [
  'Proprietary business context (“the Acme acquisition terms”)',
  'Indirect identifiers (“Bangalore + fintech + Series B”)',
  'PII embedded in images / audio / PDFs (multimodal — future work)',
  'PII in RAG-retrieved context that never passes through user input (architectural gap)',
  'Person names / orgs / locations without Presidio backend (SDK/server tier only)',
];

export function AegisArchitecture() {
  return (
    <section id="architecture" className="scroll-mt-20 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          num="05"
          eyebrow="Architecture"
          title={
            <>
              How it <br className="hidden sm:block" />
              <span className="text-muted-foreground/70">
                <span className="aegis-text-gradient">works.</span>
              </span>
            </>
          }
          description="One engine. Every surface. Zero forks."
        />

        {/* System diagram — horizontally scrollable on mobile (saves ~600px of
            vertical space vs stacking 3 columns + Core), horizontal row on
            desktop with visible arrows. */}
        <ScrollReveal delay={0.05} className="mt-6 sm:mt-10">
          <div className="flex overflow-x-auto lg:overflow-visible flex-nowrap lg:flex-wrap gap-3 lg:gap-4 items-stretch pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0 snap-x">
            <DiagramColumn
              title="Input surfaces"
              items={[
                { title: 'MCP Server', sub: 'Claude Desktop · Cursor · Windsurf' },
                { title: 'SDK', sub: 'npm · PyPI (planned)' },
                { title: 'Browser ext', sub: 'fallback (optional)' },
              ]}
            />

            <DiagramArrow />

            <DiagramCore />

            <DiagramArrow />

            <DiagramColumn
              title="Egress"
              items={[
                { title: 'AI Provider', sub: 'OpenAI · Anthropic · Gemini · BYOK' },
                { title: 'Rehydrate', sub: 'tokens → originals (client-side)' },
                { title: 'Audit chain', sub: 'SHA-256 hash-linked, append-only' },
              ]}
            />
          </div>

          <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-center gap-2 text-[10px] sm:text-[11px] text-muted-foreground">
            <ArrowLeftRight className="size-3.5 text-primary" />
            <span>
              The AI client itself calls{' '}
              <code className="aegis-mono text-primary">aegis.redact()</code>{' '}
              before sending and{' '}
              <code className="aegis-mono text-primary">aegis.rehydrate()</code> on
              the response — no third party ever reads the conversation.
            </span>
          </div>
        </ScrollReveal>

        {/* Upgrade callouts — each in a ScrollCard3D for the fanning effect */}
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <ScrollCard3D intensity={10}>
            <UpgradeCard
              icon={Plug}
              title="MCP-first"
              tone="entity-IP_ADDRESS"
              body="Any MCP-compatible client gets redaction natively. No DOM scraping. No trust paradox."
            />
          </ScrollCard3D>
          <ScrollCard3D intensity={10}>
            <UpgradeCard
              icon={ScanFace}
              title="Presidio-backed"
              tone="entity-AADHAAR"
              body="Microsoft's battle-tested detection engine. Better recall on names, orgs, unstructured context."
            />
          </ScrollCard3D>
          <ScrollCard3D intensity={10}>
            <UpgradeCard
              icon={Radio}
              title="Streaming-aware"
              tone="entity-CREDIT_CARD"
              body="PII split across chunk boundaries? The sliding window catches it. Watch it live above."
            />
          </ScrollCard3D>
        </div>

        {/* Honest limits + portfolio narrative */}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <ScrollReveal>
            {/* Honest limits */}
            <GlassPanel className="rounded-3xl p-4 sm:p-6 h-full">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="size-4 text-primary" />
                <h3 className="aegis-eyebrow text-muted-foreground">Honest limits</h3>
              </div>
              
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                <div className="glass rounded-2xl p-3 sm:p-4">
                  <div className="aegis-eyebrow text-primary mb-2">
                    ✓ Catches
                  </div>
                  <ul className="space-y-1">
                    {RELIABLY_CATCHES.map((item) => (
                      <li key={item} className="flex items-start gap-1.5">
                        <Check className="size-3 text-primary shrink-0 mt-0.5" />
                        <span className="text-[10px] sm:text-[11px] text-muted-foreground aegis-mono leading-relaxed">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="glass rounded-2xl p-3 sm:p-4">
                  <div className="aegis-eyebrow text-destructive mb-2">
                    ✗ Cannot catch
                  </div>
                  <ul className="space-y-1">
                    {CANNOT_RELIABLY_CATCH.map((item) => (
                      <li key={item} className="flex items-start gap-1.5">
                        <X className="size-3 text-destructive shrink-0 mt-0.5" />
                        <span className="text-[10px] sm:text-[11px] text-muted-foreground aegis-mono leading-relaxed">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              {/* Honest v1 claim callout — glass with left accent */}
              <div className="mt-4 glass rounded-2xl border-l-2 border-l-primary p-3 sm:p-4 text-xs">
                <span className="font-medium text-foreground">
                  The honest v1 claim:
                </span>{' '}
                <span className="text-muted-foreground italic">
                  “Prevents accidental credential/PII leakage with a verifiable,
                  local-first, provider-agnostic audit trail.”
                </span>{' '}
                Not “protects all your business secrets.”
              </div>
            </GlassPanel>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            {/* Portfolio narrative — primary-tinted glass */}
            <GlassPanel className="rounded-3xl p-4 sm:p-6 ring-1 ring-primary/30 bg-primary/5 h-full">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="size-4 text-primary" />
                <h3 className="aegis-eyebrow text-muted-foreground">
                  Why it matters
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Security-first', 'Hash-chained logs', 'AES-256 vaults', 'Local-only', 'MCP over DOM scraping', 'Presidio reuse', 'Streaming-aware', 'CI-gated accuracy', '$0 infra', 'Open-source'].map((tag) => (
                  <span key={tag} className="glass rounded-full px-2.5 py-1 text-[10px] aegis-mono text-primary border border-primary/20">
                    {tag}
                  </span>
                ))}
              </div>
            </GlassPanel>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

function UpgradeCard({
  icon: Icon,
  title,
  body,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  tone: string;
}) {
  return (
    <motion.div whileHover={{ y: -2 }}>
      <GlassPanel
        className={cn(
          'rounded-3xl p-4 sm:p-6 flex flex-col gap-3 h-full',
          tone,
        )}
      >
        <span className="entity-chip inline-flex items-center gap-1.5 rounded-lg px-2 py-1 self-start w-fit">
          <Icon className="size-3.5" />
          <span className="aegis-eyebrow text-[9px]">{title}</span>
        </span>
        <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
      </GlassPanel>
    </motion.div>
  );
}

function DiagramColumn({
  title,
  items,
  accent,
}: {
  title: string;
  items: { title: string; sub: string }[];
  accent?: string;
}) {
  return (
    <div className={cn('rounded-lg border p-3 shrink-0 w-[260px] lg:w-auto lg:flex-1 min-w-0 snap-start', accent ?? 'border-sky-400/30 bg-sky-400/5')}>
      <div className="aegis-eyebrow text-muted-foreground mb-2">{title}</div>
      <div className="flex flex-col gap-2">
        {items.map((it) => (
          <div key={it.title} className="rounded-md border border-border/60 bg-background/60 p-2">
            <div className="text-xs font-medium">{it.title}</div>
            <div className="text-[10px] text-muted-foreground">{it.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DiagramArrow() {
  return (
    <div className="hidden lg:flex items-center justify-center text-muted-foreground shrink-0">
      <ArrowRight className="size-5" />
    </div>
  );
}

function DiagramCore() {
  return (
    <GlassPanel
      className="rounded-3xl p-3 sm:p-4 flex flex-col gap-2 ring-1 ring-primary/40 bg-primary/5 shrink-0 w-[280px] lg:w-auto lg:flex-1 min-w-0 snap-start"
    >
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-4 text-primary" />
        <div className="text-xs font-semibold">Aegis Core Engine</div>
        <span className="ml-auto text-[10px] aegis-mono glass rounded-full border border-primary/30 text-primary px-2 py-0.5">@aegis/core</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { name: 'Detection', sub: 'regex bank + glossary' },
          { name: 'Tokenization', sub: 'reversible pseudonyms' },
          { name: 'Policy', sub: 'strictness + entities' },
          { name: 'Audit', sub: 'SHA-256 hash chain' },
          { name: 'Streaming', sub: 'sliding window' },
          { name: 'Presidio adapter', sub: 'SDK tier (planned)' },
        ].map((m) => (
          <div key={m.name} className="rounded-md border border-border/60 bg-background/60 p-2">
            <div className="text-xs font-medium">{m.name}</div>
            <div className="text-[10px] text-muted-foreground">{m.sub}</div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}
