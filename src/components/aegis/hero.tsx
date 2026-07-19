'use client';

import * as React from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ArrowDown, ShieldCheck, Link2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLiquidGlass } from './glass-panel';
import DotMatrixBackground from './dot-matrix-background';

const MARQUEE_ITEMS = [
  'EMAIL', 'API KEY', 'PHONE', 'CREDIT CARD', 'AADHAAR', 'PAN',
  'IP ADDRESS', 'GLOSSARY', 'SHA-256 HASH CHAIN', 'STREAMING-AWARE',
  'MCP-READY', 'LOCAL-FIRST', 'PROVIDER-AGNOSTIC', 'ZERO INFRA',
];

export function AegisHero() {
  const prefersReduced = useReducedMotion();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const titleY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const cardY = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const cardOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const cardRotate = useTransform(scrollYProgress, [0, 1], [0, -3]);
  const dotOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.2]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section
      id="top"
      ref={containerRef}
      className="relative isolate min-h-screen flex items-center overflow-hidden pt-28 pb-12"
    >
      {/* WebGL dot-matrix field — flowing Perlin-noise dots in the Aegis palette. */}
      <motion.div
        className="absolute inset-0 opacity-30 pointer-events-none"
        aria-hidden
        style={prefersReduced ? undefined : { opacity: dotOpacity }}
      >
        <DotMatrixBackground
          frequency={2}
          speed={3}
          cellSize={14}
          gamma={5}
          paletteBias={6}
          colors={['#0a0f14', '#0f3a2a', '#5eead4']}
          bgColor="transparent"
        />
      </motion.div>
      {/* Radial scrim — darker at edges for text legibility + depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            'radial-gradient(80% 60% at 40% 40%, transparent 0%, color-mix(in oklch, var(--background) 55%, transparent) 100%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 w-full">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left: editorial headline */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={prefersReduced ? undefined : { y: titleY, opacity: titleOpacity }}
            className="lg:col-span-8 flex flex-col gap-6"
          >
            {/* Eyebrow — refined pill instead of plain text */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex items-center gap-3"
            >
              <span className="glass rounded-full px-3 py-1 flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary aegis-live-dot" />
                <span className="aegis-eyebrow text-primary">local-first</span>
              </span>
              <span className="aegis-eyebrow text-muted-foreground">
                redaction layer for AI
              </span>
            </motion.div>

            {/* Headline — refined hierarchy: first line muted, second line bold + gradient */}
            <h1 className="aegis-serif text-[2.75rem] sm:text-6xl lg:text-7xl xl:text-[5.5rem] leading-[0.95] tracking-tight">
              <motion.span
                initial={prefersReduced ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15 }}
                className="block text-foreground/50 italic"
              >
                Your prompts leak.
              </motion.span>
              <motion.span
                initial={prefersReduced ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="block"
              >
                Aegis makes them{' '}
                <span className="aegis-text-gradient">safe.</span>
              </motion.span>
            </h1>

            {/* Description — plain language, bold the key phrase */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed"
            >
              When you paste a prompt into ChatGPT, Claude, or Gemini, your emails,
              API keys, cards and IDs go with it.{' '}
              <strong className="text-foreground font-medium">
                Aegis strips them out before they leave your device
              </strong>{' '}
              — and gives you a cryptographic receipt proving exactly what was sent.
            </motion.p>

            {/* 3-step "how it works" — glass cards with icons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="flex flex-col sm:flex-row gap-2.5 max-w-2xl"
            >
              {[
                { num: '01', icon: ArrowRight, title: 'You paste', desc: 'A prompt with emails, keys, cards' },
                { num: '02', icon: Zap, title: 'Aegis strips', desc: 'PII → tokens, before it leaves' },
                { num: '03', icon: ShieldCheck, title: 'You verify', desc: 'Tamper-proof log of what was sent' },
              ].map((step, i) => (
                <div key={step.num} className="flex items-center gap-2 flex-1">
                  {i > 0 && (
                    <span className="text-muted-foreground/30 text-lg hidden sm:block aegis-mono">→</span>
                  )}
                  <div className="glass rounded-2xl px-3.5 py-3 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <step.icon className="size-3 text-primary" />
                      <span className="aegis-mono text-[9px] text-muted-foreground">{step.num}</span>
                    </div>
                    <div className="text-xs font-semibold text-foreground">{step.title}</div>
                    <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{step.desc}</div>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.65 }}
              className="flex flex-wrap items-center gap-3 pt-1"
            >
              <Button
                variant="glass-primary"
                size="lg-pill"
                onClick={() => scrollTo('playground')}
                className="h-12 group"
              >
                Try the playground
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button
                variant="glass"
                size="lg-pill"
                onClick={() => scrollTo('architecture')}
                className="h-12 text-muted-foreground hover:text-foreground"
              >
                See the architecture
              </Button>
            </motion.div>
          </motion.div>

          {/* Right: floating glass proof card — refined with more depth */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 30, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={prefersReduced ? undefined : { y: cardY, opacity: cardOpacity, rotate: cardRotate }}
            className="lg:col-span-4"
          >
            <GlassProofCard />
          </motion.div>
        </div>

        {/* Kinetic marquee — at the bottom, refined */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-14 sm:mt-16 -mx-4 sm:-mx-6"
        >
          <div className="aegis-marquee py-3 border-y border-foreground/8">
            <div className="aegis-marquee-track">
              {MARQUEE_ITEMS.map((item, i) => (
                <span key={i} className="flex items-center gap-3 text-xs text-muted-foreground/80">
                  <span className="size-1 rounded-full bg-primary/70" />
                  <span className="aegis-mono uppercase tracking-[0.15em]">{item}</span>
                </span>
              ))}
            </div>
            <div className="aegis-marquee-track" aria-hidden>
              {MARQUEE_ITEMS.map((item, i) => (
                <span key={i} className="flex items-center gap-3 text-xs text-muted-foreground/80">
                  <span className="size-1 rounded-full bg-primary/70" />
                  <span className="aegis-mono uppercase tracking-[0.15em]">{item}</span>
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] text-muted-foreground/60"
      >
        <ArrowDown className="size-3 animate-bounce" />
        <span className="aegis-mono uppercase tracking-[0.2em]">scroll to redact</span>
      </motion.div>
    </section>
  );
}

/**
 * GlassProofCard — the floating "live audit chain" proof.
 * Refined: better visual hierarchy, bigger VERIFIED badge, more depth.
 */
function GlassProofCard() {
  const ref = useLiquidGlass<HTMLDivElement>(true, { scale: -90, chroma: 5, blur: 4 });
  return (
    <div className="relative max-w-sm mx-auto">
      {/* Glow behind the card */}
      <div
        className="absolute -inset-4 rounded-[2rem] opacity-40 blur-2xl pointer-events-none"
        style={{ background: 'radial-gradient(60% 60% at 50% 40%, color-mix(in oklch, var(--primary) 25%, transparent) 0%, transparent 70%)' }}
        aria-hidden
      />
      <div ref={ref} className="glass relative rounded-3xl p-6">
        {/* Header with prominent VERIFIED badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link2 className="size-3.5 text-primary" />
            <span className="aegis-eyebrow text-muted-foreground">audit chain</span>
          </div>
          <span className="flex items-center gap-1.5 glass rounded-full px-2 py-0.5 border border-primary/30 bg-primary/10">
            <span className="size-1.5 rounded-full bg-primary aegis-live-dot" />
            <span className="text-[10px] text-primary aegis-mono font-semibold">VERIFIED</span>
          </span>
        </div>

        {/* Seq number — large, focal */}
        <div className="mb-4">
          <div className="aegis-eyebrow text-muted-foreground/60 mb-1">latest entry</div>
          <div className="flex items-baseline gap-2">
            <span className="aegis-mono text-4xl font-semibold text-foreground">042</span>
            <span className="aegis-mono text-xs text-muted-foreground">/ chain</span>
          </div>
        </div>

        {/* Data rows */}
        <div className="space-y-2 aegis-mono text-[11px] leading-relaxed">
          <div className="flex justify-between">
            <span className="text-muted-foreground">hash</span>
            <span className="text-foreground">8f3a…c2e1</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">types</span>
            <span className="text-foreground">EMAIL · API_KEY</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">provider</span>
            <span className="text-foreground">openai</span>
          </div>
        </div>

        {/* Integrity footer */}
        <div className="mt-4 pt-3 border-t border-foreground/10 flex items-center justify-between">
          <span className="aegis-eyebrow text-muted-foreground">integrity</span>
          <span className="flex items-center gap-1.5 text-primary text-xs font-medium">
            <ShieldCheck className="size-3.5" />
            chain intact
          </span>
        </div>
      </div>

      {/* Caption */}
      <p className="mt-3 text-center text-[10px] text-muted-foreground/70 aegis-mono leading-relaxed">
        ↑ every redaction appends here.<br />
        tamper any entry and the chain breaks downstream.
      </p>
    </div>
  );
}
