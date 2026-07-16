'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ShieldCheck, ArrowRight, Cpu, Link2, Radio, Plug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const STATS = [
  { label: '8 entity types', icon: Cpu },
  { label: 'Tamper-evident hash chain', icon: Link2 },
  { label: 'Streaming-aware', icon: Radio },
  { label: 'MCP-ready', icon: Plug },
];

export function AegisHero() {
  const prefersReduced = useReducedMotion();
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section
      id="top"
      className="relative isolate overflow-hidden border-b border-border/60"
    >
      {/* Backgrounds */}
      <div className="absolute inset-0 aegis-grid opacity-60" aria-hidden />
      <div className="absolute inset-0 aegis-glow" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-20 sm:py-28 lg:py-32">
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex flex-col items-start gap-6 max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-primary">
            <span className="size-1.5 rounded-full bg-primary aegis-live-dot" />
            Local-first · Provider-agnostic · $0 infra
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05]">
            Trust is contractual.
            <br />
            <span className="bg-gradient-to-br from-primary via-emerald-300 to-primary/70 bg-clip-text text-transparent">
              Aegis makes it provable.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Aegis sits between you and any AI provider — OpenAI, Anthropic, Gemini, or
            your own. It strips emails, keys, cards, Aadhaar, PAN, IPs and your custom
            glossary terms out of every prompt <em>before</em> they leave the device,
            swaps them for reversible tokens, and writes a SHA-256 hash-chained audit
            log you can verify independently. No black-box DLP. No trust required.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button size="lg" onClick={() => scrollTo('playground')} className="h-11">
              Try the playground
              <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollTo('architecture')}
              className="h-11"
            >
              See the architecture
            </Button>

            <div className="ml-1 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs">
              <span className="size-2 rounded-full bg-emerald-400 aegis-live-dot" />
              <span className="text-muted-foreground">Engine:</span>
              <span className="font-medium text-emerald-300">online</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {STATS.map((s) => (
              <Badge
                key={s.label}
                variant="outline"
                className="gap-1.5 rounded-md border-border/70 bg-card/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
              >
                <s.icon className="size-3 text-primary" />
                {s.label}
              </Badge>
            ))}
          </div>
        </motion.div>

        {/* Floating verification panel — a tasteful decorative proof. */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
          className="pointer-events-none absolute right-8 top-24 hidden w-80 rounded-xl border border-border/60 bg-card/70 p-4 shadow-2xl backdrop-blur-sm lg:block"
          aria-hidden
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              audit chain · last entry
            </span>
            <ShieldCheck className="size-4 text-primary" />
          </div>
          <div className="mt-3 aegis-mono text-[11px] text-muted-foreground break-all leading-relaxed">
            <div className="text-foreground/90">seq: 042</div>
            <div>hash: 8f3a…c2e1</div>
            <div>types: EMAIL, API_KEY</div>
            <div className="text-emerald-300">integrity: ✓ verified</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
