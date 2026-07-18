'use client';

import * as React from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLiquidGlass } from './glass-panel';

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
              Sits between you and any AI provider. Strips emails, keys, cards,
              Aadhaar, PAN and IPs <em className="aegis-serif text-foreground/90 not-italic font-normal">before</em> they
              leave the device — then writes a SHA-256 hash-chained audit log you
              can verify yourself. No black-box DLP. No trust required.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap items-center gap-3"
            >
              <Button
                size="lg"
                onClick={() => scrollTo('playground')}
                className="h-12 px-6 rounded-full active:scale-[0.98] group"
              >
                Try the playground
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => scrollTo('architecture')}
                className="h-12 px-6 rounded-full active:scale-[0.98] text-muted-foreground hover:text-foreground hover:bg-foreground/5"
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
  const ref = useLiquidGlass<HTMLDivElement>({ scale: -90, chroma: 5, blur: 4 });
  return (
    <>
      <div
        ref={ref}
        className="glass glass-glare rounded-3xl p-6 max-w-sm mx-auto"
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
