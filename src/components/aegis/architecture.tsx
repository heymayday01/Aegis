'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
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

const REVEAL = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function AegisArchitecture() {
  const prefersReduced = useReducedMotion();
  return (
    <section id="architecture" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          num="05"
          eyebrow="Architecture"
          title={
            <>
              How it <br className="hidden sm:block" />
              <span className="italic text-muted-foreground">
                <span className="aegis-text-gradient">works.</span>
              </span>
            </>
          }
          description="One core engine, four surfaces. The same @aegis/core that powers this dashboard ships in the MCP server, the SDK, and (eventually) the optional browser extension — so detection behaviour is identical everywhere."
        />

        {/* System diagram — three glass columns */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          className="mt-10"
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_1.4fr_auto_1fr] items-stretch">
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

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <ArrowLeftRight className="size-3.5 text-primary" />
            <span>
              The AI client itself calls{' '}
              <code className="aegis-mono text-primary">aegis.redact()</code>{' '}
              before sending and{' '}
              <code className="aegis-mono text-primary">aegis.rehydrate()</code> on
              the response — no third party ever reads the conversation.
            </span>
          </div>
        </motion.div>

        {/* Upgrade callouts */}
        <motion.div
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: prefersReduced ? 0 : 0.06,
              },
            },
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-4 grid gap-4 md:grid-cols-3"
        >
          <UpgradeCard
            icon={Plug}
            title="MCP-first"
            tone="entity-IP_ADDRESS"
            body="Model Context Protocol is the emerging standard for AI-client ↔ tool integration. Aegis ships as an MCP server so any compatible client — Claude Desktop, Cursor, Windsurf — gets redaction natively. No DOM scraping, no “third party reads my chats” trust paradox, future-proof against new AI clients."
          />
          <UpgradeCard
            icon={ScanFace}
            title="Presidio-backed"
            tone="entity-AADHAAR"
            body="Microsoft Presidio is the mature, battle-tested open-source detection engine. Rather than reinvent it, the SDK/server tier swaps the in-browser regex bank for Presidio via a thin adapter. Same DetectionResult contract, much better recall on names, orgs, and unstructured context."
          />
          <UpgradeCard
            icon={Radio}
            title="Streaming-aware"
            tone="entity-CREDIT_CARD"
            body="LLM responses stream token-by-token. PII like john@acme.com gets split across chunk boundaries (john@ac | me.com). Aegis holds back a sliding window, runs detection on the buffer, and flushes confirmed-safe text immediately while keeping ambiguous tails held. Watch it live above."
          />
        </motion.div>

        {/* Honest limits + portfolio narrative */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          className="mt-4 grid gap-4 lg:grid-cols-2"
        >
          {/* Honest limits */}
          <GlassPanel className="rounded-3xl p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="size-4 text-primary" />
              <h3 className="aegis-eyebrow text-muted-foreground">Honest limits</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              A security product that overclaims is worse than one that doesn’t
              ship. Here’s exactly what v1 can and can’t catch — stated on the
              dashboard, not buried in a footnote.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="glass rounded-2xl p-4">
                <div className="aegis-eyebrow text-primary mb-2">
                  ✓ Reliably catches
                </div>
                <ul className="space-y-1.5">
                  {RELIABLY_CATCHES.map((item) => (
                    <li key={item} className="flex items-start gap-1.5">
                      <Check className="size-3 text-primary shrink-0 mt-0.5" />
                      <span className="text-[11px] text-muted-foreground aegis-mono leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="glass rounded-2xl p-4">
                <div className="aegis-eyebrow text-destructive mb-2">
                  ✗ Cannot reliably catch
                </div>
                <ul className="space-y-1.5">
                  {CANNOT_RELIABLY_CATCH.map((item) => (
                    <li key={item} className="flex items-start gap-1.5">
                      <X className="size-3 text-destructive shrink-0 mt-0.5" />
                      <span className="text-[11px] text-muted-foreground aegis-mono leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {/* Honest v1 claim callout — glass with left accent */}
            <div className="mt-4 glass rounded-2xl border-l-2 border-l-primary p-4 text-xs">
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

          {/* Portfolio narrative — primary-tinted glass */}
          <GlassPanel className="rounded-3xl p-6 sm:p-8 ring-1 ring-primary/30 bg-primary/5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="size-4 text-primary" />
              <h3 className="aegis-eyebrow text-muted-foreground">
                Why this is portfolio-worthy
              </h3>
            </div>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
              <p>
                AI vendors make trust claims that are contractual, not provable.
                Enterprise DLP costs $25–30/user/month, locking out freelancers
                and SMBs. Aegis is local-first, provider-agnostic, and ships a
                tamper-evident hash chain so you can verify what was sent where.
              </p>
              <p>What it demonstrates that a CRUD app doesn’t:</p>
              <ul className="space-y-1.5 text-xs">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-semibold">·</span>
                  <span>
                    <span className="text-foreground font-medium">
                      Security-first thinking
                    </span>{' '}
                    — hash-chained tamper-evident logs, AES-256-GCM vaults,
                    local-only processing.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-semibold">·</span>
                  <span>
                    <span className="text-foreground font-medium">
                      Architectural judgment
                    </span>{' '}
                    — MCP over DOM scraping, Presidio reuse over reinvention,
                    shared core across surfaces.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-semibold">·</span>
                  <span>
                    <span className="text-foreground font-medium">Modernity</span>{' '}
                    — streaming-aware redaction, MCP protocol awareness,
                    2025-relevant LLM feature handling.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-semibold">·</span>
                  <span>
                    <span className="text-foreground font-medium">
                      Engineering maturity
                    </span>{' '}
                    — accuracy regression gates in CI, round-trip invariants,
                    documented security disclosure path.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-semibold">·</span>
                  <span>
                    <span className="text-foreground font-medium">Honesty</span>{' '}
                    — stated limits, kill criteria, 0.x.x versioning, “verify it
                    yourself” as the actual pitch.
                  </span>
                </li>
              </ul>
            </div>
            {/* Hard-edged badges (mono pills, primary-tinted) */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center rounded-full border border-primary/30 text-primary px-2.5 py-0.5 text-[11px] aegis-mono">
                $0 infra
              </span>
              <span className="inline-flex items-center rounded-full border border-primary/30 text-primary px-2.5 py-0.5 text-[11px] aegis-mono">
                Open-source
              </span>
              <span className="inline-flex items-center rounded-full border border-primary/30 text-primary px-2.5 py-0.5 text-[11px] aegis-mono">
                TypeScript strict
              </span>
              <span className="inline-flex items-center rounded-full border border-primary/30 text-primary px-2.5 py-0.5 text-[11px] aegis-mono">
                CI-gated accuracy
              </span>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </section>
  );
}

function DiagramColumn({
  title,
  items,
}: {
  title: string;
  items: { title: string; sub: string }[];
}) {
  return (
    <GlassPanel className="rounded-3xl p-4 flex flex-col gap-2">
      <div className="aegis-eyebrow text-muted-foreground text-[9px]">{title}</div>
      <div className="flex flex-col gap-2 flex-1">
        {items.map((it) => (
          <div key={it.title} className="glass rounded-xl p-3">
            <div className="text-xs font-medium">{it.title}</div>
            <div className="text-[10px] text-muted-foreground aegis-mono">
              {it.sub}
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

function DiagramArrow() {
  return (
    <div className="hidden lg:flex items-center justify-center text-muted-foreground">
      <ArrowRight className="size-5" />
    </div>
  );
}

function DiagramCore() {
  return (
    <GlassPanel className="rounded-3xl p-4 flex flex-col gap-2 ring-1 ring-primary/40 bg-primary/5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-4 text-primary" />
        <div className="text-xs font-semibold">Aegis Core Engine</div>
        <span className="ml-auto text-[10px] aegis-mono glass rounded-full border border-primary/30 text-primary px-2 py-0.5">
          @aegis/core
        </span>
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
          <div key={m.name} className="glass rounded-xl p-2.5">
            <div className="text-xs font-medium">{m.name}</div>
            <div className="text-[10px] text-muted-foreground aegis-mono">
              {m.sub}
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
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
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      variants={prefersReduced ? {} : REVEAL}
      whileHover={prefersReduced ? undefined : { y: -2 }}
    >
      <GlassPanel
        glare
        className={cn(
          'rounded-3xl p-6 sm:p-7 flex flex-col gap-3 h-full',
          tone,
        )}
      >
        {/* Entity-colored tag — uses .entity-XXX (sets --ec) + .entity-chip for the
            bg/border/color mix. */}
        <span className="entity-chip inline-flex items-center gap-1.5 rounded-lg px-2 py-1 self-start w-fit">
          <Icon className="size-3.5" />
          <span className="aegis-eyebrow text-[9px]">{title}</span>
        </span>
        <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
      </GlassPanel>
    </motion.div>
  );
}
