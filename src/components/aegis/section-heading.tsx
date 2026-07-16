'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * SectionHeading — editorial magazine style.
 * A numbered eyebrow ("01 / Playground") + serif title + muted description.
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
    <div
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
    </div>
  );
}
