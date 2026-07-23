'use client';

import * as React from 'react';
import { motion, useReducedMotion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowRight, ArrowDown, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleShield3D } from './particle-shield-3d';

/**
 * AegisHero — minimal, spacious, cinematic.
 *
 * Design philosophy: "kill your darlings." The hero has exactly 4 elements:
 *   1. Eyebrow badge (local-first)
 *   2. Headline (word-by-word blur reveal)
 *   3. One CTA
 *   4. 3D particle shield (background, breathing)
 *
 * Everything else (audit card, before/after strip, marquee, trust line) was
 * removed. The hero is for emotion and value proposition, not data logs.
 */
export function AegisHero() {
  const prefersReduced = useReducedMotion();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const titleY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const shieldOpacity = useTransform(scrollYProgress, [0, 0.5], [0.7, 0.15]);

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

  // Delays — start AFTER the cinematic loader exits (1.8s + 0.3s curtain)
  const D = 1.9; // base delay

  return (
    <section
      id="top"
      ref={containerRef}
      className="relative isolate min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-12"
    >
      {/* 3D particle shield — centered behind text, breathing */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={prefersReduced ? { opacity: 0.5 } : { opacity: shieldOpacity }}
      >
        <ParticleShield3D />
      </motion.div>

      {/* Scrim — directional gradient for text readability */}
      <div className="absolute inset-0 bg-background/35 pointer-events-none" aria-hidden />
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            'radial-gradient(60% 50% at 50% 50%, transparent 0%, color-mix(in oklch, var(--background) 40%, transparent) 100%)',
        }}
      />

      {/* Entrance overlay sweep — plays right as the curtain opens */}
      {!prefersReduced && (
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: D }}
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            background:
              'linear-gradient(105deg, transparent 30%, color-mix(in oklch, var(--primary) 8%, transparent) 50%, transparent 70%)',
          }}
          aria-hidden
        />
      )}

      {/* Centered content — minimal, spacious */}
      <motion.div
        initial={prefersReduced ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={prefersReduced ? undefined : { y: titleY, opacity: titleOpacity }}
        className="relative z-10 flex flex-col items-center text-center gap-8 px-4 sm:px-6 max-w-4xl"
      >
        {/* Eyebrow — single small badge */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: D }}
        >
          <span className="glass glass-chromatic rounded-full px-4 py-1.5 flex items-center gap-2">
            <Lock className="size-3 text-primary" />
            <span className="aegis-eyebrow text-primary">local-first redaction layer</span>
          </span>
        </motion.div>

        {/* Headline — word-by-word blur reveal, centered, large */}
        <h1 className="aegis-display text-[2.5rem] sm:text-6xl lg:text-7xl xl:text-[5rem] leading-[1.05] tracking-tight">
          <span className="inline-block overflow-hidden align-bottom mr-[0.25em]">
            <motion.span
              initial={prefersReduced ? false : { y: '110%', filter: 'blur(10px)', opacity: 0 }}
              animate={{ y: 0, filter: 'blur(0px)', opacity: 1 }}
              transition={{ duration: 0.7, delay: D + 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="inline-block"
            >
              Your
            </motion.span>
          </span>
          <span className="inline-block overflow-hidden align-bottom mr-[0.25em]">
            <motion.span
              initial={prefersReduced ? false : { y: '110%', filter: 'blur(10px)', opacity: 0 }}
              animate={{ y: 0, filter: 'blur(0px)', opacity: 1 }}
              transition={{ duration: 0.7, delay: D + 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="inline-block"
            >
              prompts
            </motion.span>
          </span>
          <span className="inline-block overflow-hidden align-bottom mr-[0.25em]">
            <motion.span
              initial={prefersReduced ? false : { y: '110%', filter: 'blur(10px)', opacity: 0 }}
              animate={{ y: 0, filter: 'blur(0px)', opacity: 1 }}
              transition={{ duration: 0.7, delay: D + 0.36, ease: [0.16, 1, 0.3, 1] }}
              className="inline-block text-foreground/40"
            >
              leak.
            </motion.span>
          </span>
          <br />
          <span className="inline-block overflow-hidden align-bottom mr-[0.25em]">
            <motion.span
              initial={prefersReduced ? false : { y: '110%', filter: 'blur(10px)', opacity: 0 }}
              animate={{ y: 0, filter: 'blur(0px)', opacity: 1 }}
              transition={{ duration: 0.7, delay: D + 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="inline-block"
            >
              Aegis
            </motion.span>
          </span>
          <span className="inline-block overflow-hidden align-bottom mr-[0.25em]">
            <motion.span
              initial={prefersReduced ? false : { y: '110%', filter: 'blur(10px)', opacity: 0 }}
              animate={{ y: 0, filter: 'blur(0px)', opacity: 1 }}
              transition={{ duration: 0.7, delay: D + 0.58, ease: [0.16, 1, 0.3, 1] }}
              className="inline-block"
            >
              makes
            </motion.span>
          </span>
          <span className="inline-block overflow-hidden align-bottom mr-[0.25em]">
            <motion.span
              initial={prefersReduced ? false : { y: '110%', filter: 'blur(10px)', opacity: 0 }}
              animate={{ y: 0, filter: 'blur(0px)', opacity: 1 }}
              transition={{ duration: 0.7, delay: D + 0.66, ease: [0.16, 1, 0.3, 1] }}
              className="inline-block"
            >
              them
            </motion.span>
          </span>
          <span className="inline-block overflow-hidden align-bottom mr-[0.25em]">
            <motion.span
              initial={prefersReduced ? false : { y: '110%', filter: 'blur(10px)', opacity: 0 }}
              animate={{ y: 0, filter: 'blur(0px)', opacity: 1 }}
              transition={{ duration: 0.7, delay: D + 0.74, ease: [0.16, 1, 0.3, 1] }}
              className="inline-block aegis-text-gradient"
            >
              safe.
            </motion.span>
          </span>
        </h1>

        {/* Single CTA — magnetic, centered */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: D + 1.0 }}
          className="flex items-center gap-4"
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
              className="h-13 px-8 text-base group"
            >
              Try the playground
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: D + 1.5 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] text-muted-foreground/50"
      >
        <ArrowDown className="size-3 animate-bounce" />
        <span className="aegis-mono uppercase tracking-[0.2em]">scroll</span>
      </motion.div>
    </section>
  );
}
