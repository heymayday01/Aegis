'use client';

import { motion, useReducedMotion } from 'framer-motion';
import CurvedLoop from './curved-marquee';

/**
 * CurvedMarqueeSection — a "moment" between sections.
 *
 * A full-bleed curved, draggable marquee that breaks the page's vertical
 * rhythm. The text arcs across the viewport in Instrument Serif, scrolls
 * at a gentle base velocity, and can be flung with pointer drag.
 *
 * On mobile the curve flattens (smaller curveAmount) and the font shrinks
 * so it stays elegant on narrow screens.
 */
export function CurvedMarqueeSection() {
  const prefersReduced = useReducedMotion();

  return (
    <section
      aria-hidden
      className="relative w-full overflow-hidden py-8 sm:py-12"
    >
      {/* Subtle top + bottom hairlines to frame the moment */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />

      <motion.div
        initial={prefersReduced ? false : { opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full"
        style={{ height: 'min(38vh, 320px)' }}
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
          baseVelocity={prefersReduced ? 0 : 28}
          curveAmount={-340}
          gap={16}
          draggable
          dragIntensity={10}
          fade
          fadePercent={14}
        />
      </motion.div>

      {/* Drag hint — fades in, then out, to invite interaction */}
      <motion.div
        initial={prefersReduced ? false : { opacity: 0 }}
        whileInView={{ opacity: [0, 1, 1, 0] }}
        viewport={{ once: true }}
        transition={{ duration: 3, delay: 1, times: [0, 0.2, 0.8, 1] }}
        className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground aegis-mono uppercase tracking-[0.2em]"
      >
        drag to fling →
      </motion.div>
    </section>
  );
}
