'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * useLiquidGlass — React hook wrapper around the drop-in liquid-glass.js module.
 * Applies real Apple-style refraction (Chromium) or frosted-blur fallback (Safari/FF).
 * Call on a ref; the module handles SVG filter + displacement map + resize.
 */
export function useLiquidGlass<T extends HTMLElement>(
  opts?: Parameters<typeof import('@/lib/liquid-glass')['default']>[1],
) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!ref.current) return;
    let instance: { destroy: () => void } | undefined;
    import('@/lib/liquid-glass').then((mod) => {
      const lg = mod.default;
      if (ref.current) {
        instance = lg(ref.current, opts);
      }
    });
    return () => instance?.destroy();
  }, []);
  return ref;
}

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  /** Apply the real liquid-glass refraction (Chromium only). Default true. */
  liquid?: boolean;
  /** Stronger tint + shadow for prominent panels. */
  strong?: boolean;
  /** Animated specular glare sweep on hover. */
  glare?: boolean;
  /** liquid-glass.js options (scale, chroma, border, etc.) */
  glassOptions?: Record<string, unknown>;
  as?: 'div' | 'section' | 'article' | 'nav' | 'header' | 'footer';
}

/**
 * GlassPanel — the canonical glass surface. Combines:
 *   - .glass / .glass-strong material dressing (tint, shadow, inset highlights)
 *   - optional .glass-glare animated specular sweep
 *   - optional real refraction via useLiquidGlass()
 *
 * Use this everywhere instead of raw <Card> for the $100k glass aesthetic.
 */
export function GlassPanel({
  children,
  className,
  liquid = true,
  strong = false,
  glare = false,
  glassOptions,
  as: Comp = 'div',
}: GlassPanelProps) {
  const ref = useLiquidGlass<HTMLDivElement>(liquid ? glassOptions : undefined);
  return (
    <Comp
      ref={ref as React.Ref<HTMLDivElement>}
      className={cn(
        'rounded-2xl',
        strong ? 'glass glass-strong' : 'glass',
        glare && 'glass-glare',
        className,
      )}
    >
      {children}
    </Comp>
  );
}
