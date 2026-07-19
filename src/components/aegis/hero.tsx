'use client';

import * as React from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ArrowDown } from 'lucide-react';
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

  const titleY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const cardY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const cardOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);
  const cardRotate = useTransform(scrollYProgress, [0, 1], [0, -4]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section
      id="top"
      ref={containerRef}
      className="relative isolate min-h-screen flex items-center overflow-hidden pt-24"
    >
      {/* WebGL dot-matrix field — flowing Perlin-noise dots in the Aegis palette.
          Low opacity so it reads as ambient texture behind the glass + orbs. */}
      <div className="absolute inset-0 opacity-30 pointer-events-none" aria-hidden>
        <DotMatrixBackground
          frequency={2}
          speed={3}
          cellSize={14}
          gamma={5}
          paletteBias={6}
          colors={['#0a0f14', '#0f3a2a', '#5eead4']}
          bgColor="transparent"
        />
      </div>
      {/* Dark scrim so text stays legible over the dot field */}
      <div className="absolute inset-0 bg-background/40 pointer-events-none" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 w-full">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left: editorial headline */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={prefersReduced ? undefined : { y: titleY, opacity: titleOpacity }}
            className="lg:col-span-8 flex flex-col gap-7"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex items-center gap-3"
            >
              <span className="aegis-eyebrow text-primary">
                A local-first redaction layer
              </span>
              <span className="h-px flex-1 max-w-20 bg-foreground/20" />
              <span className="aegis-mono text-[10px] text-muted-foreground">
                EST. 2026
              </span>
            </motion.div>

            <h1 className="aegis-serif text-[3rem] sm:text-6xl lg:text-7xl xl:text-8xl leading-[0.92] tracking-tight">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15 }}
                className="block"
              >
                Trust is{' '}
                <span className="italic text-muted-foreground">contractual.</span>
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="block"
              >
                Aegis makes it{' '}
                <span className="aegis-text-gradient">provable.</span>
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed"
            >
              When you paste a prompt into ChatGPT, Claude, or Gemini, your emails,
              API keys, credit cards and IDs go with it. <strong className="text-foreground font-medium">Aegis strips them out
              before they leave your device</strong> — and gives you a cryptographic receipt
              proving exactly what was sent.
            </motion.p>

            {/* 3-step "how it works" — makes the value instantly clear */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-2 max-w-2xl"
            >
              {[
                { num: '01', title: 'You paste', desc: 'A prompt with emails, keys, cards, IDs' },
                { num: '02', title: 'Aegis strips', desc: 'PII replaced with tokens — before it leaves' },
                { num: '03', title: 'You verify', desc: 'Tamper-proof log of what was actually sent' },
              ].map((step, i) => (
                <div key={step.num} className="flex items-center gap-2.5 flex-1">
                  {i > 0 && <span className="text-muted-foreground/40 text-sm hidden sm:block">→</span>}
                  <div className="glass rounded-2xl px-3 py-2.5 flex-1 min-w-0">
                    <div className="aegis-mono text-[10px] text-primary">{step.num}</div>
                    <div className="text-xs font-semibold text-foreground">{step.title}</div>
                    <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{step.desc}</div>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap items-center gap-3"
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

          {/* Right: floating glass proof card */}
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

        {/* Kinetic marquee */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16 sm:mt-20 -mx-4 sm:-mx-6"
        >
          <div className="aegis-marquee py-3">
            <div className="aegis-marquee-track">
              {MARQUEE_ITEMS.map((item, i) => (
                <span key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="size-1 rounded-full bg-primary" />
                  <span className="aegis-mono uppercase tracking-wide">{item}</span>
                </span>
              ))}
            </div>
            <div className="aegis-marquee-track" aria-hidden>
              {MARQUEE_ITEMS.map((item, i) => (
                <span key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="size-1 rounded-full bg-primary" />
                  <span className="aegis-mono uppercase tracking-wide">{item}</span>
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
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[11px] text-muted-foreground"
      >
        <ArrowDown className="size-3 animate-bounce" />
        <span className="aegis-mono uppercase tracking-wide">scroll to redact</span>
      </motion.div>
    </section>
  );
}

function GlassProofCard() {
  const ref = useLiquidGlass<HTMLDivElement>(true, { scale: -90, chroma: 5, blur: 4 });
  return (
    <>
      <div
        ref={ref}
        className="glass rounded-3xl p-6 max-w-sm mx-auto"
      >
        <div className="flex items-center justify-between border-b border-foreground/10 pb-3">
          <span className="aegis-eyebrow text-muted-foreground">
            audit chain · live
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-primary aegis-mono">
            <span className="size-1.5 rounded-full bg-primary aegis-live-dot" />
            VERIFIED
          </span>
        </div>
        <div className="mt-4 space-y-2 aegis-mono text-[11px] leading-relaxed">
          <div className="flex justify-between">
            <span className="text-muted-foreground">seq</span>
            <span className="text-foreground">042</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground shrink-0">hash</span>
            <span className="text-foreground truncate">8f3a…c2e1</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">types</span>
            <span className="text-foreground">EMAIL, API_KEY</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">provider</span>
            <span className="text-foreground">openai</span>
          </div>
          <div className="flex justify-between border-t border-foreground/10 pt-2 mt-2">
            <span className="text-muted-foreground">integrity</span>
            <span className="text-primary">✓ chain intact</span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-[10px] text-muted-foreground aegis-mono leading-relaxed">
        ↑ every redaction appends here.<br />
        tamper any entry and the chain breaks downstream.
      </p>
    </>
  );
}
