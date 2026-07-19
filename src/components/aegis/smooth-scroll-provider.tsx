'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * SmoothScrollProvider — wraps the app in a Lenis smooth-scroll context.
 * Lenis is the industry standard for premium-feel sites: it intercepts wheel
 * events and animates the scroll position with a subtle inertia, giving every
 * page that buttery $100k-site feel. Respects prefers-reduced-motion.
 */
export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 0.8,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      // Sync Lenis's rAF with the browser's — prevents double rAF loops.
      syncTouch: false,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
