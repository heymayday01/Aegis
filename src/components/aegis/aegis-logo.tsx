'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * AegisLogo — the branded Aegis shield logo.
 *
 * A custom SVG shield with:
 *   - Geometric shield outline (not a generic lucide icon)
 *   - Inner "A" monogram formed by negative space
 *   - Mint-jade gradient fill on the shield body
 *   - Subtle glow effect
 *
 * Variants:
 *   - "full" — shield + "Aegis" wordmark (for nav, footer)
 *   - "icon" — shield only (for buttons, badges, loader)
 *   - "animated" — shield with a draw-on + glow pulse animation
 */

interface AegisLogoProps {
  variant?: 'full' | 'icon' | 'animated';
  size?: number;
  className?: string;
  showWordmark?: boolean;
}

export function AegisLogo({
  variant = 'icon',
  size = 32,
  className,
  showWordmark = false,
}: AegisLogoProps) {
  const prefersReduced = useReducedMotion();
  const isAnimated = variant === 'animated' && !prefersReduced;

  const shield = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-label="Aegis logo"
    >
      <defs>
        <linearGradient id="aegis-shield-grad" x1="24" y1="2" x2="24" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5eead4" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#2dd4bf" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#0f3a2a" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="aegis-stroke-grad" x1="24" y1="2" x2="24" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.4" />
        </linearGradient>
        <filter id="aegis-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Shield outline — geometric, not rounded */}
      <motion.path
        d="M24 3 L8 9 V22 C8 32 14 40 24 45 C34 40 40 32 40 22 V9 L24 3 Z"
        fill="url(#aegis-shield-grad)"
        stroke="url(#aegis-stroke-grad)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        filter="url(#aegis-glow)"
        initial={isAnimated ? { pathLength: 0, opacity: 0 } : false}
        animate={isAnimated ? { pathLength: 1, opacity: 1 } : undefined}
        transition={isAnimated ? { duration: 1.2, ease: [0.16, 1, 0.3, 1] } : undefined}
      />

      {/* Inner "A" monogram — formed by two angled lines + crossbar */}
      <motion.g
        initial={isAnimated ? { opacity: 0, scale: 0.5 } : false}
        animate={isAnimated ? { opacity: 1, scale: 1 } : undefined}
        transition={isAnimated ? { duration: 0.6, delay: 0.8, ease: [0.16, 1, 0.3, 1] } : undefined}
      >
        {/* Left stroke of A */}
        <path d="M24 14 L18 32" stroke="#5eead4" strokeWidth="2.5" strokeLinecap="round" />
        {/* Right stroke of A */}
        <path d="M24 14 L30 32" stroke="#5eead4" strokeWidth="2.5" strokeLinecap="round" />
        {/* Crossbar */}
        <path d="M20 26 L28 26" stroke="#5eead4" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      </motion.g>

      {/* Top highlight — specular edge */}
      <path
        d="M24 3 L8 9 V14 L24 8 L40 14 V9 L24 3 Z"
        fill="#5eead4"
        opacity="0.15"
      />
    </svg>
  );

  if (variant === 'full' || showWordmark) {
    return (
      <div className={cn('flex items-center gap-2.5', className)}>
        {shield}
        <span className="aegis-display text-lg sm:text-xl tracking-tight">Aegis</span>
      </div>
    );
  }

  return shield;
}

/**
 * AegisLogo3D — a 3D rotating version of the logo for the loader.
 * The shield rotates on Y axis with a glow pulse.
 */
export function AegisLogo3D({ size = 64 }: { size?: number }) {
  const prefersReduced = useReducedMotion();

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Glow behind */}
      <motion.div
        className="absolute -inset-4 rounded-full"
        style={{
          background: 'radial-gradient(circle, color-mix(in oklch, var(--primary) 35%, transparent) 0%, transparent 70%)',
        }}
        initial={prefersReduced ? false : { opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 0.6, 0.8], scale: [0.5, 1.2, 1] }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
      {/* 3D rotating shield */}
      <motion.div
        className="relative grid place-items-center"
        style={{ width: size, height: size, transformStyle: 'preserve-3d', perspective: 400 }}
        initial={prefersReduced ? false : { rotateY: 0, scale: 0.8 }}
        animate={prefersReduced ? undefined : { rotateY: [0, 10, 0, -10, 0], scale: 1 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <AegisLogo variant="animated" size={size} />
      </motion.div>
    </div>
  );
}
