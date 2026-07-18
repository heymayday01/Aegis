'use client';

import * as React from 'react';
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from 'framer-motion';
import { Github, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
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
  const { scrollY } = useScroll();
  const lastY = React.useRef(0);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const prev = lastY.current;
    lastY.current = latest;
    // Hide on scroll-down, show on scroll-up (after 200px).
    if (latest > prev && latest > 240) setHidden(true);
    else setHidden(false);
    setScrolled(latest > 20);
  });

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

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{
          y: hidden ? -100 : 0,
          opacity: 1,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="pointer-events-auto mt-4 px-4 w-full max-w-3xl"
      >
        <PillNav
          active={active}
          scrolled={scrolled}
          onItemClick={handleClick}
          onMobileOpen={() => setMobileOpen(true)}
        />
      </motion.header>

      {/* Mobile sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="top" className="w-full p-0 border-0 bg-transparent">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="p-4">
            <MobileGlassNav
              active={active}
              onItemClick={handleClick}
              onClose={() => setMobileOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function PillNav({
  active,
  scrolled,
  onItemClick,
  onMobileOpen,
}: {
  active: string;
  scrolled: boolean;
  onItemClick: (e: React.MouseEvent<HTMLAnchorElement>, id: string) => void;
  onMobileOpen: () => void;
}) {
  const ref = useLiquidGlass<HTMLDivElement>({
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
        'glass glass-glare flex items-center justify-between gap-2 rounded-full pl-5 pr-2 py-2 transition-shadow',
        scrolled && 'shadow-2xl',
      )}
    >
      {/* Wordmark */}
      <a
        href="#top"
        onClick={(e) => onItemClick(e, 'top')}
        className="flex items-center gap-2 group rounded-full active:scale-[0.97] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Aegis home"
      >
        <span className="grid size-6 place-items-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30 group-hover:bg-primary/25 transition-colors">
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </span>
        <span className="aegis-serif text-lg leading-none">Aegis</span>
      </a>

      {/* Desktop links */}
      <nav className="hidden md:flex items-center gap-0.5" aria-label="Sections">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => onItemClick(e, item.id)}
            className={cn(
              'relative px-3.5 py-1.5 text-sm rounded-full transition-colors active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active === item.id
                ? 'text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
            aria-current={active === item.id ? 'true' : undefined}
          >
            {active === item.id && (
              <motion.span
                layoutId="nav-pill"
                className="absolute inset-0 rounded-full bg-primary/90"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10">{item.label}</span>
          </a>
        ))}
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
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden size-8 rounded-full hover:bg-foreground/10"
          aria-label="Open navigation menu"
          onClick={onMobileOpen}
        >
          <Menu className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function MobileGlassNav({
  active,
  onItemClick,
  onClose,
}: {
  active: string;
  onItemClick: (e: React.MouseEvent<HTMLAnchorElement>, id: string) => void;
  onClose: () => void;
}) {
  const ref = useLiquidGlass<HTMLDivElement>({ scale: -50, blur: 6 });
  return (
    <div ref={ref} className="glass rounded-3xl p-3 flex flex-col gap-1">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="aegis-serif text-lg">Sections</span>
        <SheetClose asChild>
          <Button variant="ghost" size="icon" className="size-8 rounded-full">
            <X className="size-4" />
          </Button>
        </SheetClose>
      </div>
      {NAV_ITEMS.map((item) => (
        <SheetClose asChild key={item.id}>
          <a
            href={`#${item.id}`}
            onClick={(e) => onItemClick(e, item.id)}
            className={cn(
              'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-colors active:scale-[0.98] min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active === item.id
                ? 'text-foreground bg-foreground/10 font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5',
            )}
            aria-current={active === item.id ? 'true' : undefined}
          >
            <span className="aegis-mono text-[11px] text-muted-foreground/60">
              {item.num}
            </span>
            {item.label}
          </a>
        </SheetClose>
      ))}
    </div>
  );
}
