/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { AegisLogo3D } from './aegis-logo';

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
  // Start with show=true to prevent ghost/flash of page content before the
  // loader appears. The loader covers the screen immediately on first paint.
  const [show, setShow] = useState(true);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    // Only play once per session. On subsequent visits, hide immediately.
    if (sessionStorage.getItem('aegis-loaded') === '1') {
      setShow(false);
      return;
    }
    sessionStorage.setItem('aegis-loaded', '1');

    // Lock scroll during the loader.
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }

    const timer = setTimeout(() => {
      setShow(false);
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    }, prefersReduced ? 400 : 1800);
    return () => {
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
            {/* 3D Aegis Logo — branded, animated, glowing */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <AegisLogo3D size={64} />
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
