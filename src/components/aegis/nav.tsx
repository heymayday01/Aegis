'use client';

import * as React from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useReducedMotion,
} from 'framer-motion';
import { Github, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLiquidGlass } from './glass-panel';

const NAV_ITEMS = [
  { id: 'playground', label: 'Playground', num: '01' },
  { id: 'streaming', label: 'Streaming', num: '02' },
  { id: 'audit', label: 'Audit', num: '03' },
  { id: 'policy', label: 'Policy', num: '04' },
  { id: 'architecture', label: 'Architecture', num: '05' },
];

export function AegisNav() {
  const [active, setActive] = React.useState<string>('playground');
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const prefersReduced = useReducedMotion();
  const { scrollY } = useScroll();
  const lastY = React.useRef(0);

  // Smoothed hide-on-scroll: only hide after a directional delta of 12px,
  // and snap back instantly on direction change. Kills the jittery feel.
  useMotionValueEvent(scrollY, 'change', (latest) => {
    // Safety: never hide at the top of the page.
    if (latest < 20) {
      setHidden(false);
      setScrolled(false);
      lastY.current = latest;
      return;
    }
    const prev = lastY.current;
    const delta = latest - prev;
    lastY.current = latest;
    setScrolled(true);
    // Only hide on a clear downward scroll (>12px delta, past 240px).
    if (delta > 12 && latest > 240 && !mobileOpen) setHidden(true);
    // Show on any upward scroll.
    else if (delta < -4) setHidden(false);
  });

  // Lock body scroll when the mobile menu is open.
  React.useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  React.useEffect(() => {
    const sections = NAV_ITEMS.map((n) => document.getElementById(n.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: [0, 0.25, 0.5, 1] },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', `#${id}`);
    }
    setMobileOpen(false);
  };

  // Spring the y position for a fluid, non-jittery hide/show.
  // Starts at 0 (visible) so the nav is always present on first paint.
  const ySpring = useSpring(0, {
    stiffness: 320,
    damping: 34,
    mass: 0.8,
  });
  // Drive the spring target from `hidden` — never let it conflict with `initial`.
  React.useEffect(() => {
    ySpring.set(hidden ? -120 : 0);
  }, [hidden, ySpring]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <motion.header
        initial={prefersReduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        style={prefersReduced ? undefined : { y: ySpring }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-auto mt-3 sm:mt-4 px-3 sm:px-4 w-full max-w-3xl"
      >
        <PillNav
          active={active}
          scrolled={scrolled}
          mobileOpen={mobileOpen}
          onItemClick={handleClick}
          onMobileToggle={() => setMobileOpen((v) => !v)}
        />
      </motion.header>

      {/* Mobile expanded menu — custom fluid animation (no Sheet) */}
      <MobileExpandingNav
        open={mobileOpen}
        active={active}
        onItemClick={handleClick}
        onClose={() => setMobileOpen(false)}
      />
    </div>
  );
}

function PillNav({
  active,
  scrolled,
  mobileOpen,
  onItemClick,
  onMobileToggle,
}: {
  active: string;
  scrolled: boolean;
  mobileOpen: boolean;
  onItemClick: (e: React.MouseEvent<HTMLAnchorElement>, id: string) => void;
  onMobileToggle: () => void;
}) {
  const ref = useLiquidGlass<HTMLDivElement>(true, {
    scale: -60,
    chroma: 4,
    border: 0.1,
    blur: 4,
    saturate: 1.4,
  });

  return (
    <div
      ref={ref}
      className={cn(
        'glass flex items-center justify-between gap-2 rounded-full pl-4 sm:pl-5 pr-1.5 sm:pr-2 py-1.5 sm:py-2 transition-shadow duration-300',
        scrolled && !mobileOpen && 'shadow-2xl shadow-black/30',
      )}
    >
      {/* Wordmark */}
      <a
        href="#top"
        onClick={(e) => onItemClick(e, 'top')}
        className="flex items-center gap-2 group rounded-full active:scale-[0.97] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Aegis home"
      >
        <span className="grid size-6 sm:size-7 place-items-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30 group-hover:bg-primary/25 group-active:bg-primary/30 transition-colors">
          <svg viewBox="0 0 24 24" className="size-3.5 sm:size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </span>
        <span className="aegis-serif text-lg sm:text-xl leading-none">Aegis</span>
      </a>

      {/* Desktop links — hidden on <md. The active pill slides via layoutId. */}
      <nav className="hidden md:flex items-center gap-0.5" aria-label="Sections">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => onItemClick(e, item.id)}
              className={cn(
                'relative px-3 py-1.5 text-[13px] font-medium rounded-full transition-colors duration-200 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              aria-current={isActive ? 'true' : undefined}
            >
              {isActive && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full bg-primary/90"
                  transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.6 }}
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </a>
          );
        })}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer noopener"
          aria-label="Source on GitHub"
          className="hidden sm:grid size-8 place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Github className="size-4" />
        </a>
        {/* Mobile toggle — morphs between Menu and X */}
        <Button
          variant="glass"
          size="icon-sm"
          className="md:hidden relative"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          onClick={onMobileToggle}
        >
          <AnimatePresence mode="wait" initial={false}>
            {mobileOpen ? (
              <motion.span
                key="x"
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                <X className="size-4" />
              </motion.span>
            ) : (
              <motion.span
                key="menu"
                initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                <Menu className="size-4" />
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </div>
    </div>
  );
}

/**
 * MobileExpandingNav — a custom fluid expand animation.
 *
 * Instead of a Sheet (which slides a fixed panel from the top edge), this
 * drops down from the nav pill itself with:
 *   - scale-y origin at the top (the menu "grows" from the nav)
 *   - opacity fade
 *   - staggered link reveal (each link fades+rises 40ms after the previous)
 *   - a full-screen backdrop that dims + dismisses on tap
 *
 * The whole thing is one AnimatePresence tree so exit is as fluid as enter.
 */
function MobileExpandingNav({
  open,
  active,
  onItemClick,
  onClose,
}: {
  open: boolean;
  active: string;
  onItemClick: (e: React.MouseEvent<HTMLAnchorElement>, id: string) => void;
  onClose: () => void;
}) {
  const ref = useLiquidGlass<HTMLDivElement>(true, { scale: -45, chroma: 3, blur: 6, saturate: 1.4 });
  const prefersReduced = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — dims the page, dismisses on tap */}
          <motion.button
            key="backdrop"
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-background/40 backdrop-blur-[2px] pointer-events-auto md:hidden"
          />

          {/* Expanding menu panel */}
          <motion.div
            key="menu"
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: 'top center' }}
            className="fixed top-20 left-3 right-3 z-50 pointer-events-auto md:hidden"
          >
            <div
              ref={ref}
              className="glass rounded-3xl p-3 flex flex-col gap-0.5 shadow-2xl shadow-black/40"
            >
              {/* Header row */}
              <div className="flex items-center justify-between px-3 py-2 mb-1">
                <span className="aegis-eyebrow text-muted-foreground">Sections</span>
                <span className="aegis-mono text-[10px] text-muted-foreground/60">05</span>
              </div>

              {/* Staggered link list */}
              {NAV_ITEMS.map((item, i) => {
                const isActive = active === item.id;
                return (
                  <motion.a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(e) => onItemClick(e, item.id)}
                    initial={prefersReduced ? false : { opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: prefersReduced ? 0 : 0.06 + i * 0.04,
                      duration: 0.3,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className={cn(
                      'group flex items-center gap-3 rounded-2xl px-3 py-3 min-h-11 transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isActive
                        ? 'text-foreground bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5',
                    )}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    <span className="aegis-mono text-[11px] text-muted-foreground/50 group-hover:text-primary transition-colors w-6">
                      {item.num}
                    </span>
                    <span className="text-sm font-medium flex-1">{item.label}</span>
                    {isActive && (
                      <motion.span
                        layoutId="mobile-nav-dot"
                        className="size-1.5 rounded-full bg-primary"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </motion.a>
                );
              })}

              {/* Footer row — GitHub + local-first badge */}
              <motion.div
                initial={prefersReduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: prefersReduced ? 0 : 0.06 + NAV_ITEMS.length * 0.04 + 0.04 }}
                className="flex items-center justify-between px-3 py-2 mt-1 border-t border-foreground/8"
              >
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Github className="size-3.5" />
                  Source
                </a>
                <span className="flex items-center gap-1.5 text-[10px] text-primary aegis-mono">
                  <span className="size-1.5 rounded-full bg-primary aegis-live-dot" />
                  local-first
                </span>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
