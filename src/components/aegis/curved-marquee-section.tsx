'use client';

import { motion, useReducedMotion } from 'framer-motion';
import CurvedLoop from './curved-marquee';

/**
 * CurvedMarqueeSection — an immersive "moment" between the hero and playground.
 *
 * Two curved marquees stacked: the primary one arcs upward (large serif text),
 * the secondary one arcs downward (smaller mono text, opposite direction).
 * Together they create a lens/wave effect that feels alive and premium.
 *
 * Generous vertical padding so the curves have room to breathe.
 */
export function CurvedMarqueeSection() {
  const prefersReduced = useReducedMotion();

  return (
    <section
      aria-hidden
      className="relative w-full overflow-hidden py-16 sm:py-24"
    >
      {/* Ambient glow behind the marquee for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(50% 70% at 50% 50%, color-mix(in oklch, var(--primary) 10%, transparent) 0%, transparent 70%)',
        }}
      />
      {/* Top + bottom hairlines */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/12 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-foreground/12 to-transparent" />

      {/* Primary marquee — large serif, arcs upward, scrolls right */}
      <motion.div
        initial={prefersReduced ? false : { opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full h-[200px] sm:h-[280px]"
      >
        <CurvedLoop
          text="VERIFY · DON'T TRUST · AEGIS · "
          font={{
            fontFamily: 'Instrument Serif, serif',
            fontWeight: 400,
            fontSize: 64,
            lineHeight: '1.5em',
            letterSpacing: '0px',
          }}
          color="var(--primary)"
          direction="right"
          baseVelocity={prefersReduced ? 0 : 22}
          curveAmount={-200}
          gap={20}
          draggable
          dragIntensity={10}
          fade
          fadePercent={18}
        />
      </motion.div>

      {/* Secondary marquee — smaller mono, arcs downward, scrolls left (creates wave) */}
      <motion.div
        initial={prefersReduced ? false : { opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full h-[120px] sm:h-[160px] -mt-8 sm:-mt-12"
      >
        <CurvedLoop
          text="local-first · streaming-aware · tamper-evident · $0 infra · "
          font={{
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 500,
            fontSize: 28,
            lineHeight: '1.5em',
            letterSpacing: '2px',
          }}
          color="var(--muted-foreground)"
          direction="left"
          baseVelocity={prefersReduced ? 0 : 18}
          curveAmount={120}
          gap={24}
          draggable={false}
          fade
          fadePercent={20}
        />
      </motion.div>

      {/* Drag hint */}
      <motion.div
        initial={prefersReduced ? false : { opacity: 0 }}
        whileInView={{ opacity: [0, 1, 1, 0] }}
        viewport={{ once: true }}
        transition={{ duration: 3.5, delay: 1.5, times: [0, 0.15, 0.85, 1] }}
        className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/50 aegis-mono uppercase tracking-[0.25em]"
      >
        drag the curve →
      </motion.div>
    </section>
  );
}
