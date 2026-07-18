'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * useLiquidGlass — React hook wrapper around the liquid-glass module.
 * Applies real Apple-style refraction (Chromium) or frosted-blur fallback.
 *
 * Performance: lazy-inits via IntersectionObserver — only creates the SVG
 * filter + displacement map when the element scrolls into view. This keeps
 * the initial render fast even with many glass panels on the page.
 */
export function useLiquidGlass<T extends HTMLElement>(
  opts?: { scale?: number; chroma?: number; border?: number; mapBlur?: number; blur?: number; saturate?: number; radius?: number; fallbackBlur?: number },
) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let instance: { destroy: () => void } | undefined;
    let observer: IntersectionObserver | undefined;
    let cancelled = false;

    // Lazy-init: only load + apply the glass when the element is near the viewport.
    const init = async () => {
      if (cancelled || !el) return;
      const mod = await import('@/lib/liquid-glass');
      const lg = mod.default;
      if (!lg || !el) return;
      instance = lg(el, opts);
    };

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            init();
            observer?.disconnect();
            break;
          }
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);

    return () => {
      cancelled = true;
      observer?.disconnect();
      instance?.destroy();
    };
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
  /** liquid-glass options (scale, chroma, border, etc.) */
  glassOptions?: { scale?: number; chroma?: number; border?: number; mapBlur?: number; blur?: number; saturate?: number; radius?: number; fallbackBlur?: number };
  as?: 'div' | 'section' | 'article' | 'nav' | 'header' | 'footer';
}

/**
 * GlassPanel — the canonical glass surface. Combines:
 *   - .glass / .glass-strong material dressing (tint, shadow, inset highlights)
 *   - optional .glass-glare animated specular sweep
 *   - optional real refraction via useLiquidGlass() (lazy-init for perf)
 *
 * Use this everywhere instead of raw <Card> for the liquid glass aesthetic.
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
