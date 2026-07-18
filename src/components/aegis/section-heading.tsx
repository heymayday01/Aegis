'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * SectionHeading — editorial magazine style, now with a liquid-glass reveal.
 *
 * A numbered eyebrow ("01 / Playground") + serif title + muted description.
 * The whole block animates in once on scroll-into-view (opacity 0→1, y 20→0),
 * respecting prefers-reduced-motion.
 *
 * The title can contain `<span className="aegis-text-gradient">accent</span>`
 * for one gradient word per section.
 */
export function SectionHeading({
  num,
  eyebrow,
  title,
  description,
  className,
  align = 'left',
}: {
  num?: string;
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  align?: 'left' | 'center';
}) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'flex flex-col gap-3',
        align === 'center' && 'items-center text-center',
        className,
      )}
    >
      <div className={cn('flex items-center gap-3', align === 'center' && 'justify-center')}>
        {num && (
          <span className="aegis-section-num text-primary">{num}</span>
        )}
        <span className="aegis-eyebrow text-muted-foreground">
          {eyebrow}
        </span>
      </div>
      <h2 className="aegis-serif text-3xl sm:text-4xl lg:text-5xl leading-[1.05] tracking-tight">
        {title}
      </h2>
      {description && (
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
          {description}
        </p>
      )}
    </motion.div>
  );
}
