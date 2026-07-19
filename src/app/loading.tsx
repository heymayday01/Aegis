import { Shield } from 'lucide-react';

/**
 * Loading state — shown during route transitions / streaming SSR.
 * A glass skeleton with a pulsing shield.
 */
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass rounded-3xl p-8 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <span className="grid size-8 place-items-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30 animate-pulse">
            <Shield className="size-4" />
          </span>
          <span className="aegis-serif text-xl">Aegis</span>
        </div>
        <div className="space-y-2">
          <div className="h-3 rounded-full bg-foreground/10 animate-pulse w-3/4" />
          <div className="h-3 rounded-full bg-foreground/10 animate-pulse w-full" />
          <div className="h-3 rounded-full bg-foreground/10 animate-pulse w-5/6" />
          <div className="h-3 rounded-full bg-foreground/10 animate-pulse w-2/3" />
        </div>
        <p className="mt-4 text-[10px] text-muted-foreground aegis-mono uppercase tracking-[0.2em]">
          initializing engine…
        </p>
      </div>
    </div>
  );
}
