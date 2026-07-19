'use client';

import { motion, useReducedMotion } from 'framer-motion';
import CurvedLoop from './curved-marquee';

/**
 * CurvedMarqueeSection — a "moment" between the hero and the playground.
 *
 * A full-bleed curved, draggable marquee. The text arcs across the viewport
 * in Instrument Serif italic, scrolls at a gentle velocity, and can be
 * flung with pointer drag. The curve is more pronounced than before
 * (curveAmount -180) so the arc is clearly visible and elegant.
 *
 * The section has generous vertical padding so the curve has room to breathe
 * and reads as a deliberate design moment, not a cramped divider.
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
            'radial-gradient(60% 80% at 50% 50%, color-mix(in oklch, var(--primary) 8%, transparent) 0%, transparent 70%)',
        }}
      />
      {/* Top + bottom hairlines */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />

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
            fontSize: 60,
            lineHeight: '1.5em',
            letterSpacing: '0px',
          }}
          color="var(--primary)"
          direction="right"
          baseVelocity={prefersReduced ? 0 : 24}
          curveAmount={-180}
          gap={18}
          draggable
          dragIntensity={10}
          fade
          fadePercent={16}
        />
      </motion.div>

      {/* Drag hint — fades in, then out */}
      <motion.div
        initial={prefersReduced ? false : { opacity: 0 }}
        whileInView={{ opacity: [0, 1, 1, 0] }}
        viewport={{ once: true }}
        transition={{ duration: 3.5, delay: 1.2, times: [0, 0.15, 0.85, 1] }}
        className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/60 aegis-mono uppercase tracking-[0.25em]"
      >
        drag to fling →
      </motion.div>
    </section>
  );
}
