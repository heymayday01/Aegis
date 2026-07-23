'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ScrollReveal } from './scroll-card-3d';

/**
 * SectionHeading — editorial magazine style.
 *
 * A numbered eyebrow ("01 / Playground") + serif title + muted description.
 * The reveal uses the shared <ScrollReveal> (0.6s ease-out, once per element)
 * for motion-language consistency across the page.
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
  return (
    <ScrollReveal
      className={cn(
        'flex flex-col gap-3 mt-2 sm:mt-0',
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
      <h2 className="aegis-display text-3xl sm:text-4xl lg:text-5xl leading-[1.05] tracking-tight">
        {title}
      </h2>
      {description && (
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
          {description}
        </p>
      )}
    </ScrollReveal>
  );
}
