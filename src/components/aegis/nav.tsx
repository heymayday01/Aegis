'use client';

import * as React from 'react';
import { Shield, Github, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';

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
  const [mobileOpen, setMobileOpen] = React.useState(false);

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
      history.replaceState(null, '', `#${id}`);
    }
    setMobileOpen(false);
  };

  const navLinkClass = (id: string) =>
    cn(
      'rounded-md px-3 py-2 text-sm transition-colors active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      active === id
        ? 'text-foreground bg-accent/60'
        : 'text-muted-foreground hover:text-foreground hover:bg-accent/40',
    );

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
          className="flex items-center gap-2.5 group rounded-md active:scale-[0.97] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Sections">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => handleClick(e, item.id)}
              className={navLinkClass(item.id)}
              aria-current={active === item.id ? 'true' : undefined}
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
            aria-label="Source on GitHub"
            className="grid size-9 place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Github className="size-4" />
          </a>

          {/* Mobile nav menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden size-9 active:scale-[0.95]"
                aria-label="Open navigation menu"
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetTitle className="px-6 pt-6 pb-2 text-base font-semibold">
                Sections
              </SheetTitle>
              <nav className="flex flex-col gap-1 px-3 py-2" aria-label="Mobile sections">
                {NAV_ITEMS.map((item) => (
                  <SheetClose asChild key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => handleClick(e, item.id)}
                      className={cn(
                        'rounded-md px-3 py-2.5 text-sm transition-colors active:scale-[0.98] min-h-11 flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        active === item.id
                          ? 'text-foreground bg-accent/60 font-medium'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/40',
                      )}
                      aria-current={active === item.id ? 'true' : undefined}
                    >
                      {item.label}
                    </a>
                  </SheetClose>
                ))}
              </nav>
              <div className="px-6 pt-4 border-t border-border/60 mt-2">
                <Badge
                  variant="outline"
                  className="border-primary/30 bg-primary/10 text-primary"
                >
                  <span className="size-1.5 rounded-full bg-primary aegis-live-dot" />
                  local-first
                </Badge>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
