'use client';

import * as React from 'react';
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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionHeading } from './section-heading';

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
    <section id="architecture" className="scroll-mt-20 border-t border-border/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
        <SectionHeading
          eyebrow="Architecture"
          title="How it works"
          description="One core engine, four surfaces. The same @aegis/core that powers this dashboard ships in the MCP server, the SDK, and (eventually) the optional browser extension — so detection behaviour is identical everywhere."
        />

        {/* System diagram */}
        <Card className="mt-8 border-border/70 overflow-hidden">
          <CardContent>
            <div className="grid gap-4 lg:grid-cols-[1fr_auto_1.4fr_auto_1fr] items-stretch">
              {/* Input surfaces */}
              <DiagramColumn
                title="Input surfaces"
                accent="border-sky-400/30 bg-sky-400/5"
                items={[
                  { title: 'MCP Server', sub: 'Claude Desktop · Cursor · Windsurf' },
                  { title: 'SDK', sub: 'npm · PyPI (planned)' },
                  { title: 'Browser ext', sub: 'fallback (optional)' },
                ]}
              />

              <DiagramArrow />

              {/* Aegis core engine */}
              <DiagramCore />

              <DiagramArrow />

              {/* Output: AI provider + rehydration */}
              <DiagramColumn
                title="Egress"
                accent="border-emerald-400/30 bg-emerald-400/5"
                items={[
                  { title: 'AI Provider', sub: 'OpenAI · Anthropic · Gemini · BYOK' },
                  { title: 'Rehydrate', sub: 'tokens → originals (client-side)' },
                  { title: 'Audit chain', sub: 'SHA-256 hash-linked, append-only' },
                ]}
              />
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <ArrowLeftRight className="size-3.5 text-primary" />
              <span>
                The AI client itself calls <code className="aegis-mono text-primary">aegis.redact()</code>{' '}
                before sending and <code className="aegis-mono text-primary">aegis.rehydrate()</code>{' '}
                on the response — no third party ever reads the conversation.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Upgrade callouts */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <UpgradeCard
            icon={Plug}
            title="MCP-first"
            tone="border-sky-400/40 bg-sky-400/5 text-sky-300"
            body="Model Context Protocol is the emerging standard for AI-client ↔ tool integration. Aegis ships as an MCP server so any compatible client — Claude Desktop, Cursor, Windsurf — gets redaction natively. No DOM scraping, no “third party reads my chats” trust paradox, future-proof against new AI clients."
          />
          <UpgradeCard
            icon={ScanFace}
            title="Presidio-backed"
            tone="border-violet-400/40 bg-violet-400/5 text-violet-300"
            body="Microsoft Presidio is the mature, battle-tested open-source detection engine. Rather than reinvent it, the SDK/server tier swaps the in-browser regex bank for Presidio via a thin adapter. Same DetectionResult contract, much better recall on names, orgs, and unstructured context."
          />
          <UpgradeCard
            icon={Radio}
            title="Streaming-aware"
            tone="border-emerald-400/40 bg-emerald-400/5 text-emerald-300"
            body="LLM responses stream token-by-token. PII like john@acme.com gets split across chunk boundaries (john@ac | me.com). Aegis holds back a sliding window, runs detection on the buffer, and flushes confirmed-safe text immediately while keeping ambiguous tails held. Watch it live above."
          />
        </div>

        {/* Honest limits + portfolio narrative */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card className="border-border/70">
            <CardContent>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="size-4 text-primary" />
                <h3 className="text-sm font-semibold">Honest limits</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                A security product that overclaims is worse than one that doesn’t ship.
                Here’s exactly what v1 can and can’t catch — stated on the dashboard, not
                buried in a footnote.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-emerald-300 mb-2">
                    ✓ Reliably catches
                  </div>
                  <ul className="space-y-1.5">
                    {RELIABLY_CATCHES.map((item) => (
                      <li key={item} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <Check className="size-3 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-destructive mb-2">
                    ✗ Cannot reliably catch
                  </div>
                  <ul className="space-y-1.5">
                    {CANNOT_RELIABLY_CATCH.map((item) => (
                      <li key={item} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <X className="size-3 text-destructive shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-4 rounded-md border border-border/60 bg-background/40 p-3 text-xs">
                <span className="font-medium text-foreground">The honest v1 claim:</span>{' '}
                <span className="text-muted-foreground italic">
                  “Prevents accidental credential/PII leakage with a verifiable, local-first,
                  provider-agnostic audit trail.”
                </span>{' '}
                Not “protects all your business secrets.”
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-primary/5">
            <CardContent>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="size-4 text-primary" />
                <h3 className="text-sm font-semibold">Why this is portfolio-worthy</h3>
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  AI vendors make trust claims that are contractual, not provable. Enterprise
                  DLP costs $25–30/user/month, locking out freelancers and SMBs. Aegis is
                  local-first, provider-agnostic, and ships a tamper-evident hash chain so
                  you can verify what was sent where.
                </p>
                <p>
                  What it demonstrates that a CRUD app doesn’t:
                </p>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-semibold">·</span>
                    <span><span className="text-foreground font-medium">Security-first thinking</span> — hash-chained tamper-evident logs, AES-256-GCM vaults, local-only processing.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-semibold">·</span>
                    <span><span className="text-foreground font-medium">Architectural judgment</span> — MCP over DOM scraping, Presidio reuse over reinvention, shared core across surfaces.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-semibold">·</span>
                    <span><span className="text-foreground font-medium">Modernity</span> — streaming-aware redaction, MCP protocol awareness, 2025-relevant LLM feature handling.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-semibold">·</span>
                    <span><span className="text-foreground font-medium">Engineering maturity</span> — accuracy regression gates in CI, round-trip invariants, documented security disclosure path.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-semibold">·</span>
                    <span><span className="text-foreground font-medium">Honesty</span> — stated limits, kill criteria, 0.x.x versioning, “verify it yourself” as the actual pitch.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">$0 infra</Badge>
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">Open-source</Badge>
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">TypeScript strict</Badge>
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">CI-gated accuracy</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function DiagramColumn({
  title,
  items,
  accent,
}: {
  title: string;
  items: { title: string; sub: string }[];
  accent: string;
}) {
  return (
    <div className={`rounded-lg border p-3 ${accent}`}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
        {title}
      </div>
      <div className="flex flex-col gap-2">
        {items.map((it) => (
          <div
            key={it.title}
            className="rounded-md border border-border/60 bg-background/60 p-2"
          >
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
    <div className="hidden lg:flex items-center justify-center text-muted-foreground">
      <ArrowRight className="size-5" />
    </div>
  );
}

function DiagramCore() {
  return (
    <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="size-4 text-primary" />
        <div className="text-xs font-semibold">Aegis Core Engine</div>
        <Badge variant="outline" className="ml-auto text-[10px] aegis-mono border-primary/30 text-primary">
          @aegis/core
        </Badge>
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
          <div
            key={m.name}
            className="rounded-md border border-border/60 bg-background/60 p-2"
          >
            <div className="text-xs font-medium">{m.name}</div>
            <div className="text-[10px] text-muted-foreground">{m.sub}</div>
          </div>
        ))}
      </div>
    </div>
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
    <Card className="border-border/70">
      <CardContent>
        <div className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 mb-3 ${tone}`}>
          <Icon className="size-3.5" />
          <span className="text-xs font-semibold uppercase tracking-wide">{title}</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
      </CardContent>
    </Card>
  );
}
