'use client';

import * as React from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MARQUEE_ITEMS = [
  'EMAIL',
  'API KEY',
  'PHONE',
  'CREDIT CARD',
  'AADHAAR',
  'PAN',
  'IP ADDRESS',
  'GLOSSARY',
  'SHA-256 HASH CHAIN',
  'STREAMING-AWARE',
  'MCP-READY',
  'LOCAL-FIRST',
  'PROVIDER-AGNOSTIC',
  'ZERO INFRA',
];

export function AegisHero() {
  const prefersReduced = useReducedMotion();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  // Subtle parallax on the floating panel — depth without being flashy.
  const panelY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const panelOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section
      id="top"
      ref={containerRef}
      className="relative isolate overflow-hidden border-b border-border/60"
    >
      <div className="absolute inset-0 aegis-grid opacity-50" aria-hidden />
      <div className="absolute inset-0 aegis-glow" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-16 pb-12 sm:pt-24 sm:pb-16 lg:pt-28 lg:pb-20">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left: editorial headline (cols 1-8) */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="lg:col-span-8 flex flex-col gap-6"
          >
            <div className="flex items-center gap-3">
              <span className="aegis-eyebrow text-primary">
                A local-first redaction layer
              </span>
              <span className="h-px flex-1 max-w-24 bg-border" />
              <span className="aegis-mono text-[10px] text-muted-foreground">
                EST. 2026
              </span>
            </div>

            <h1 className="aegis-serif text-[2.75rem] sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
              Trust is{' '}
              <span className="italic text-muted-foreground">contractual.</span>
              <br />
              Aegis makes it{' '}
              <span className="relative inline-block">
                <span className="relative z-10 text-primary">provable.</span>
                <span
                  className="absolute left-0 bottom-1 h-3 w-full bg-primary/20 -z-0"
                  aria-hidden
                />
              </span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
              Sits between you and any AI provider. Strips emails, keys, cards,
              Aadhaar, PAN and IPs <em className="aegis-serif text-foreground/90 not-italic font-normal">before</em> they
              leave the device — then writes a SHA-256 hash-chained audit log you
              can verify yourself. No black-box DLP. No trust required.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                size="lg"
                onClick={() => scrollTo('playground')}
                className="h-12 px-6 active:scale-[0.98] group"
              >
                Try the playground
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => scrollTo('architecture')}
                className="h-12 px-6 active:scale-[0.98] text-muted-foreground hover:text-foreground"
              >
                See the architecture
              </Button>
            </div>
          </motion.div>

          {/* Right: floating proof card (cols 9-12) */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
            style={prefersReduced ? undefined : { y: panelY, opacity: panelOpacity }}
            className="lg:col-span-4 lg:pt-8"
          >
            <div className="aegis-card aegis-card-hover p-5">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="aegis-eyebrow text-muted-foreground">
                  audit chain · live
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-primary aegis-mono">
                  <span className="size-1.5 rounded-full bg-primary aegis-live-dot" />
                  VERIFIED
                </span>
              </div>
              <div className="mt-3 space-y-1.5 aegis-mono text-[11px] leading-relaxed">
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
                <div className="flex justify-between border-t border-border/60 pt-1.5 mt-2">
                  <span className="text-muted-foreground">integrity</span>
                  <span className="text-primary">✓ chain intact</span>
                </div>
              </div>
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground aegis-mono leading-relaxed">
              ↑ every redaction appends here. tamper any entry and the chain breaks downstream.
            </p>
          </motion.div>
        </div>

        {/* Kinetic marquee — entity types scrolling. The anti-AI signature. */}
        <div className="mt-12 sm:mt-16 -mx-4 sm:-mx-6">
          <div className="aegis-marquee py-3 border-y border-border/60">
            <div className="aegis-marquee-track">
              {MARQUEE_ITEMS.map((item, i) => (
                <span
                  key={i}
                  className="flex items-center gap-3 text-sm text-muted-foreground"
                >
                  <span className="size-1 rounded-full bg-primary" />
                  <span className="aegis-mono uppercase tracking-wide">{item}</span>
                </span>
              ))}
            </div>
            {/* Duplicate track for seamless loop */}
            <div className="aegis-marquee-track" aria-hidden>
              {MARQUEE_ITEMS.map((item, i) => (
                <span
                  key={i}
                  className="flex items-center gap-3 text-sm text-muted-foreground"
                >
                  <span className="size-1 rounded-full bg-primary" />
                  <span className="aegis-mono uppercase tracking-wide">{item}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="mt-8 flex items-center gap-2 text-[11px] text-muted-foreground">
          <ArrowDown className="size-3 animate-bounce" />
          <span className="aegis-mono uppercase tracking-wide">scroll to redact</span>
        </div>
      </div>
    </section>
  );
}
