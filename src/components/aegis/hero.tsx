'use client';

import * as React from 'react';
import { motion, useReducedMotion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowRight, ArrowDown, ShieldCheck, Lock, Sparkles } from 'lucide-react';
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

  const titleY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const cardY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const cardOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const dotOpacity = useTransform(scrollYProgress, [0, 0.5], [0.22, 0.04]);

  // Magnetic CTA effect
  const ctaX = useSpring(0, { stiffness: 200, damping: 15 });
  const ctaY = useSpring(0, { stiffness: 200, damping: 15 });

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCtaMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 8;
    ctaX.set(x);
    ctaY.set(y);
  };
  const handleCtaLeave = () => {
    ctaX.set(0);
    ctaY.set(0);
  };

  return (
    <section
      id="top"
      ref={containerRef}
      className="relative isolate min-h-screen flex items-center overflow-hidden pt-28 pb-12"
    >
      {/* WebGL dot-matrix field */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={prefersReduced ? { opacity: 0.22 } : { opacity: dotOpacity }}
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
      {/* Scrim */}
      <div className="absolute inset-0 bg-background/40 pointer-events-none" aria-hidden />
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            'radial-gradient(70% 50% at 30% 35%, transparent 0%, color-mix(in oklch, var(--background) 45%, transparent) 100%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 w-full">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left: bold typographic statement */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={prefersReduced ? undefined : { y: titleY, opacity: titleOpacity }}
            className="lg:col-span-7 flex flex-col gap-6"
          >
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex items-center gap-2.5"
            >
              <span className="glass rounded-full px-3 py-1 flex items-center gap-2">
                <Lock className="size-3 text-primary" />
                <span className="aegis-eyebrow text-primary">local-first</span>
              </span>
              <span className="aegis-eyebrow text-muted-foreground">redaction layer for AI</span>
            </motion.div>

            {/* Hero headline — single bold statement, no competing first line */}
            <h1 className="aegis-serif text-[2.5rem] sm:text-6xl lg:text-7xl xl:text-[5rem] leading-[1] tracking-tight">
              <motion.span
                initial={prefersReduced ? false : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="block"
              >
                Your prompts{' '}
                <span className="italic text-foreground/40">leak.</span>
              </motion.span>
              <motion.span
                initial={prefersReduced ? false : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="block mt-1"
              >
                Aegis makes them{' '}
                <span className="aegis-text-gradient">safe.</span>
              </motion.span>
            </h1>

            {/* Subhead — concise, bold the key phrase */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed"
            >
              Every prompt you send to ChatGPT, Claude, or Gemini carries your emails,
              keys, and IDs.{' '}
              <span className="text-foreground font-medium">
                Aegis strips them before they leave your device
              </span>{' '}
              — and proves it with a tamper-evident audit chain.
            </motion.p>

            {/* Single dominant CTA — magnetic hover, no competing secondary button */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex items-center gap-4 pt-2"
            >
              <motion.div
                style={prefersReduced ? undefined : { x: ctaX, y: ctaY }}
                onMouseMove={handleCtaMove}
                onMouseLeave={handleCtaLeave}
              >
                <Button
                  variant="glass-primary"
                  size="lg-pill"
                  onClick={() => scrollTo('playground')}
                  className="h-13 px-7 text-base group"
                >
                  Try the playground
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </motion.div>
              <button
                onClick={() => scrollTo('architecture')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors aegis-mono uppercase tracking-[0.15em] active:scale-[0.97]"
              >
                How it works
              </button>
            </motion.div>

            {/* Trust line — minimal, no clutter */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.75 }}
              className="flex items-center gap-4 pt-2 text-[11px] text-muted-foreground/70"
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3 text-primary" />
                SHA-256 hash chain
              </span>
              <span className="size-1 rounded-full bg-muted-foreground/30" />
              <span className="flex items-center gap-1.5">
                <Sparkles className="size-3 text-primary" />
                streaming-aware
              </span>
              <span className="size-1 rounded-full bg-muted-foreground/30" />
              <span>$0 infra</span>
            </motion.div>
          </motion.div>

          {/* Right: the glass proof card — the focal 'hero' element */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 30, rotate: -1.5 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={prefersReduced ? undefined : { y: cardY, opacity: cardOpacity }}
            className="lg:col-span-5"
          >
            <GlassProofCard />
          </motion.div>
        </div>

        {/* Kinetic marquee — refined, tighter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.85 }}
          className="mt-14 sm:mt-16 -mx-4 sm:-mx-6"
        >
          <div className="aegis-marquee py-2.5 border-y border-foreground/8">
            <div className="aegis-marquee-track">
              {MARQUEE_ITEMS.map((item, i) => (
                <span key={i} className="flex items-center gap-3 text-[11px] text-muted-foreground/60">
                  <span className="size-1 rounded-full bg-primary/60" />
                  <span className="aegis-mono uppercase tracking-[0.15em]">{item}</span>
                </span>
              ))}
            </div>
            <div className="aegis-marquee-track" aria-hidden>
              {MARQUEE_ITEMS.map((item, i) => (
                <span key={i} className="flex items-center gap-3 text-[11px] text-muted-foreground/60">
                  <span className="size-1 rounded-full bg-primary/60" />
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
        transition={{ delay: 1.3 }}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] text-muted-foreground/50"
      >
        <ArrowDown className="size-3 animate-bounce" />
        <span className="aegis-mono uppercase tracking-[0.2em]">scroll</span>
      </motion.div>
    </section>
  );
}

/**
 * GlassProofCard — the focal hero element. A living audit-chain snapshot
 * with an animated counter, glow, and real glass refraction.
 */
function GlassProofCard() {
  const ref = useLiquidGlass<HTMLDivElement>(true, { scale: -90, chroma: 5, blur: 4 });
  const [count, setCount] = React.useState(0);
  const prefersReduced = useReducedMotion();

  // Animate the counter from 0 → 042 on mount.
  React.useEffect(() => {
    if (prefersReduced) {
      setCount(42);
      return;
    }
    let raf: number;
    const start = performance.now();
    const duration = 1500;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(eased * 42));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [prefersReduced]);

  return (
    <div className="relative max-w-md mx-auto">
      {/* Ambient glow — the card emanates light */}
      <div
        className="absolute -inset-6 rounded-[2.5rem] opacity-50 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(60% 60% at 50% 30%, color-mix(in oklch, var(--primary) 30%, transparent) 0%, transparent 70%)' }}
        aria-hidden
      />
      <div ref={ref} className="glass relative rounded-[1.75rem] p-7">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
              <ShieldCheck className="size-3.5" />
            </span>
            <span className="aegis-eyebrow text-muted-foreground">audit chain</span>
          </div>
          <span className="flex items-center gap-1.5 glass rounded-full px-2.5 py-1 border border-primary/30 bg-primary/10">
            <span className="size-1.5 rounded-full bg-primary aegis-live-dot" />
            <span className="text-[10px] text-primary aegis-mono font-semibold">VERIFIED</span>
          </span>
        </div>

        {/* The counter — the focal number */}
        <div className="mb-5">
          <div className="aegis-eyebrow text-muted-foreground/50 mb-1">latest entry</div>
          <div className="flex items-baseline gap-2">
            <span className="aegis-mono text-5xl font-semibold text-foreground tabular-nums">
              {String(count).padStart(3, '0')}
            </span>
            <span className="aegis-mono text-xs text-muted-foreground">/ chain</span>
          </div>
        </div>

        {/* Data rows */}
        <div className="space-y-2.5 aegis-mono text-[11px] leading-relaxed">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">hash</span>
            <span className="text-foreground/90">8f3a…c2e1</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">redacted</span>
            <span className="text-foreground/90">EMAIL · API_KEY</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">provider</span>
            <span className="text-foreground/90">openai</span>
          </div>
        </div>

        {/* Integrity footer */}
        <div className="mt-5 pt-4 border-t border-foreground/10 flex items-center justify-between">
          <span className="aegis-eyebrow text-muted-foreground">integrity</span>
          <span className="flex items-center gap-1.5 text-primary text-xs font-medium">
            <ShieldCheck className="size-3.5" />
            chain intact
          </span>
        </div>
      </div>

      {/* Caption */}
      <p className="mt-4 text-center text-[10px] text-muted-foreground/60 aegis-mono leading-relaxed">
        every redaction appends here.<br />
        tamper any entry — the chain breaks downstream.
      </p>
    </div>
  );
}
