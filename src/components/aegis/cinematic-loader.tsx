'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

/**
 * CinematicLoader — a branded preloader that plays once on first visit.
 *
 * Sequence:
 *   1. Black screen with centered Aegis shield (0 → 0.4s)
 *   2. Shield glows + a progress line fills beneath it (0.4s → 1.6s)
 *   3. "AEGIS" wordmark fades in below (0.8s → 1.4s)
 *   4. Curtain reveal — two panels slide apart, revealing the site (1.6s → 2.2s)
 *
 * Uses sessionStorage so it only plays once per session — returning users
 * see the site immediately.
 */
export function CinematicLoader() {
  const [show, setShow] = useState(false);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    // Only play once per session.
    if (sessionStorage.getItem('aegis-loaded') === '1') return;
    sessionStorage.setItem('aegis-loaded', '1');
    // Defer to avoid cascading renders.
    const raf = requestAnimationFrame(() => {
      setShow(true);
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'hidden';
      }
    });
    const timer = setTimeout(() => {
      setShow(false);
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    }, prefersReduced ? 600 : 2400);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, [prefersReduced]);

  if (prefersReduced) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Two-panel curtain that slides apart on exit */}
          <motion.div
            className="absolute inset-y-0 left-0 w-1/2 bg-background"
            exit={{ x: '-100%' }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          />
          <motion.div
            className="absolute inset-y-0 right-0 w-1/2 bg-background"
            exit={{ x: '100%' }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          />

          {/* Centered content */}
          <div className="relative z-10 flex flex-col items-center gap-6">
            {/* Shield */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              {/* Glow behind shield */}
              <motion.div
                className="absolute -inset-8 rounded-full"
                style={{ background: 'radial-gradient(circle, color-mix(in oklch, var(--primary) 30%, transparent) 0%, transparent 70%)' }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 0.6, 0.8], scale: [0.5, 1.2, 1] }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
              <div className="relative grid size-16 place-items-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30">
                <svg viewBox="0 0 24 24" className="size-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
            </motion.div>

            {/* Wordmark */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="aegis-display text-2xl tracking-[0.3em] uppercase text-foreground"
            >
              Aegis
            </motion.div>

            {/* Progress line */}
            <motion.div
              className="h-px bg-foreground/10 rounded-full overflow-hidden"
              style={{ width: '120px' }}
            >
              <motion.div
                className="h-full bg-primary"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
