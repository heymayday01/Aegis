'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform, useReducedMotion, type MotionStyle } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * ScrollCard3D — a card that rotates in 3D as it scrolls through the viewport.
 *
 * As the card enters from the bottom, it starts rotated -8° on Y and slightly
 * scaled down; as it centers it's flat (0°, scale 1); as it exits the top it
 * rotates +8°. This gives a "cards fanning through 3D space" feel that's the
 * signature of premium scroll-driven sites.
 *
 * Respects prefers-reduced-motion (renders static).
 */
export function ScrollCard3D({
  children,
  className,
  intensity = 8,
}: {
  children: ReactNode;
  className?: string;
  /** Max rotation degrees. Default 8. */
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // 0 (entering) → 0.5 (centered) → 1 (exiting)
  const rotateY = useTransform(scrollYProgress, [0, 0.5, 1], [-intensity, 0, intensity]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.94, 1, 0.94]);
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.4, 1, 1, 0.4]);

  const style: MotionStyle = prefersReduced
    ? {}
    : { rotateY, scale, opacity, transformPerspective: 1000 };

  return (
    <motion.div
      ref={ref}
      style={style}
      className={cn('card-3d', className)}
    >
      {children}
    </motion.div>
  );
}

/**
 * ScrollReveal — a simpler fade+rise reveal for elements that don't need 3D.
 * Unified motion language: 0.6s ease-out, 30px rise, once per element.
 */
export function ScrollReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
