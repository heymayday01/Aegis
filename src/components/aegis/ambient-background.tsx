'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

/**
 * AmbientBackground — the scroll-reactive depth layer behind all glass.
 *
 * Three drifting radial orbs (mint-jade / violet / sky) that:
 *   1. Drift slowly on their own (CSS keyframes)
 *   2. Parallax-shift based on scroll position (framer-motion useScroll)
 *   3. Subtly respond to pointer movement (springed mouse parallax)
 *
 * Plus a faint grid overlay for depth. This is what makes the glass refract
 * something interesting instead of a flat dark void.
 */
export function AmbientBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Scroll-driven parallax for each orb (different speeds = depth).
  const y1 = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const y2 = useTransform(scrollYProgress, [0, 1], ['0%', '-30%']);
  const y3 = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);

  // Springed mouse parallax — the orbs gently follow the cursor.
  const mouseX = useSpring(0, { stiffness: 40, damping: 20, mass: 0.5 });
  const mouseY = useSpring(0, { stiffness: 40, damping: 20, mass: 0.5 });

  useEffect(() => {
    if (prefersReduced) return;
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2; // -1..1
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      mouseX.set(x);
      mouseY.set(y);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [mouseX, mouseY, prefersReduced]);

  const px1 = useTransform(mouseX, [-1, 1], [-20, 20]);
  const py1 = useTransform(mouseY, [-1, 1], [-15, 15]);
  const px2 = useTransform(mouseX, [-1, 1], [15, -15]);
  const py2 = useTransform(mouseY, [-1, 1], [10, -10]);

  return (
    <div ref={containerRef} className="aegis-aurora" aria-hidden>
      {/* Grid overlay — faint depth. */}
      <div className="absolute inset-0 aegis-grid opacity-40" />

      {/* Orb 1 — mint-jade, top-left. */}
      <motion.div
        className="aegis-orb aegis-orb-1"
        style={prefersReduced ? undefined : { y: y1, x: px1, translateY: py1 }}
      />
      {/* Orb 2 — violet, right. */}
      <motion.div
        className="aegis-orb aegis-orb-2"
        style={prefersReduced ? undefined : { y: y2, x: px2, translateY: py2 }}
      />
      {/* Orb 3 — sky, bottom. */}
      <motion.div
        className="aegis-orb aegis-orb-3"
        style={prefersReduced ? undefined : { y: y3 }}
      />

      {/* Vignette — pulls focus to center, deepens edges. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 30%, transparent 40%, color-mix(in oklch, var(--background) 70%, transparent) 100%)',
        }}
      />
    </div>
  );
}

