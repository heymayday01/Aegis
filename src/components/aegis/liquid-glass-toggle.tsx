'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * LiquidGlassToggle — a premium segmented toggle with chromatic glass edges.
 *
 * Inspired by Framer's liquid glass buttons: thick smoked-glass material with
 * multi-layered lighting (specular top highlight, inner shadow), chromatic
 * conic-gradient border, and a sliding active pill that morphs between options.
 *
 * The active pill uses layoutId for a spring-animated slide between options.
 */
export function LiquidGlassToggle<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
}: {
  options: { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div
      className={cn(
        'glass glass-chromatic glass-specular relative inline-flex items-center rounded-full p-1',
        size === 'sm' ? 'gap-0.5' : 'gap-1',
        className,
      )}
    >
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative z-10 flex items-center gap-1.5 rounded-full font-medium transition-colors duration-200 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
              size === 'sm' ? 'px-3 py-1 text-[11px]' : 'px-4 py-1.5 text-[13px]',
              isActive
                ? 'text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
            aria-pressed={isActive}
          >
            {isActive && (
              <motion.span
                layoutId="liquid-toggle-pill"
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(180deg, color-mix(in oklch, var(--primary) 90%, white 10%) 0%, var(--primary) 50%, color-mix(in oklch, var(--primary) 70%, black 30%) 100%)',
                  boxShadow: '0 2px 8px -1px color-mix(in oklch, var(--primary) 40%, transparent), inset 0 1px 1px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.15)',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 32, mass: 0.6 }}
              />
            )}
            {opt.icon && <span className="relative z-10">{opt.icon}</span>}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
