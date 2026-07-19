'use client';

import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

/**
 * AmbientBackground — the depth layer behind all glass.
 *
 * Perf-optimized: removed mouse-parallax springs (4 springs + 4 transforms
 * firing on every mousemove was a major scroll-lag contributor). Kept only
 * the scroll-driven parallax (1 transform per orb) + CSS keyframe drift.
 *
 * Three radial orbs (mint-jade / violet / sky) that drift slowly on their
 * own and parallax-shift based on scroll position. Plus a faint grid overlay.
 */
export function AmbientBackground() {
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

  return (
    <div className="aegis-aurora" aria-hidden>
      {/* Grid overlay — faint depth. */}
      <div className="absolute inset-0 aegis-grid opacity-40" />

      {/* Orb 1 — mint-jade, top-left. */}
      <motion.div
        className="aegis-orb aegis-orb-1"
        style={prefersReduced ? undefined : { y: y1 }}
      />
      {/* Orb 2 — violet, right. */}
      <motion.div
        className="aegis-orb aegis-orb-2"
        style={prefersReduced ? undefined : { y: y2 }}
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
