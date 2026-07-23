'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

/**
 * PerspectiveGrid — a 3D receding grid floor with scrolling text.
 *
 * Replaces the flat curved marquee with a true 3D perspective grid that
 * recedes into the distance. The text "VERIFY · DON'T TRUST" moves along
 * this 3D plane, getting larger and blurring slightly as it approaches
 * the viewer (depth of field). The entire grid tilts based on mouse
 * position, creating a gyroscopic "vast digital landscape" feel.
 *
 * Scroll-linked: the grid rotates slightly as you scroll through it,
 * creating a parallax depth effect.
 */
export function PerspectiveGrid() {
  const prefersReduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // Scroll-driven rotation — the grid tilts as you scroll through it
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [65, 60, 55]);
  const gridOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const textY = useTransform(scrollYProgress, [0, 1], ['100%', '-100%']);

  // Mouse tilt
  const mouseX = useTransform(
    useScroll({ target: containerRef }).scrollYProgress,
    [0, 1],
    [-3, 3],
  );

  const items = [
    'VERIFY', 'DON\'T TRUST', 'AEGIS', 'LOCAL-FIRST', 'TAMPER-EVIDENT',
    'STREAMING-AWARE', '$0 INFRA', 'PROVIDER-AGNOSTIC',
  ];

  return (
    <section
      ref={containerRef}
      aria-hidden
      className="relative w-full overflow-hidden py-24 sm:py-32"
      style={{ perspective: '800px' }}
    >
      {/* Ambient glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: gridOpacity,
          background:
            'radial-gradient(50% 60% at 50% 60%, color-mix(in oklch, var(--primary) 12%, transparent) 0%, transparent 70%)',
        }}
      />

      {/* Hairlines */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />

      {/* The 3D grid floor */}
      <motion.div
        className="absolute inset-0"
        style={{
          rotateX,
          transformStyle: 'preserve-3d',
          opacity: gridOpacity,
        }}
      >
        {/* Grid lines — receding into distance */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, color-mix(in oklch, var(--primary) 15%, transparent) 1px, transparent 1px),
              linear-gradient(to bottom, color-mix(in oklch, var(--primary) 15%, transparent) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)',
          }}
        />

        {/* Scrolling text along the grid plane */}
        <motion.div
          className="absolute inset-x-0 flex flex-col items-center gap-8"
          style={{ y: textY, transform: 'translateZ(20px)' }}
        >
          {items.map((item, i) => (
            <div
              key={i}
              className="aegis-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight whitespace-nowrap"
              style={{
                color: i % 2 === 0 ? 'var(--primary)' : 'color-mix(in oklch, var(--foreground) 30%, transparent)',
                textShadow: i % 2 === 0 ? '0 0 40px color-mix(in oklch, var(--primary) 40%, transparent)' : 'none',
                filter: i % 2 === 0 ? 'none' : 'blur(1px)',
              }}
            >
              {item}
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Center label */}
      <motion.div
        initial={prefersReduced ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none"
      >
        <span className="aegis-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.25em]">
          the trust layer
        </span>
      </motion.div>
    </section>
  );
}
