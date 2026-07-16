'use client';

import * as React from 'react';
import { Shield, Github } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const NAV_ITEMS = [
  { id: 'playground', label: 'Playground' },
  { id: 'streaming', label: 'Streaming' },
  { id: 'audit', label: 'Audit Log' },
  { id: 'policy', label: 'Policy' },
  { id: 'architecture', label: 'Architecture' },
];

export function AegisNav() {
  const [scrolled, setScrolled] = React.useState(false);
  const [active, setActive] = React.useState<string>('playground');

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Track active section via IntersectionObserver for the smooth-scroll anchors.
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
      // Update hash without jumping.
      history.replaceState(null, '', `#${id}`);
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl transition-colors',
        scrolled && 'bg-background/85 border-border',
      )}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <a
          href="#top"
          onClick={(e) => handleClick(e, 'top')}
          className="flex items-center gap-2.5 group"
          aria-label="Aegis home"
        >
          <span className="grid size-7 place-items-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/30 group-hover:bg-primary/25 transition-colors">
            <Shield className="size-4" strokeWidth={2.25} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Aegis</span>
          <span className="hidden sm:inline text-[11px] text-muted-foreground aegis-mono">
            v0.1.0
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => handleClick(e, item.id)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm transition-colors',
                active === item.id
                  ? 'text-foreground bg-accent/60'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/40',
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="hidden sm:inline-flex border-primary/30 bg-primary/10 text-primary"
          >
            <span className="size-1.5 rounded-full bg-primary aegis-live-dot" />
            local-first
          </Badge>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Source"
            className="grid size-9 place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            <Github className="size-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
