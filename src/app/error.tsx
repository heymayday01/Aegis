'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

/**
 * Global error boundary — catches unhandled errors and shows a recovery UI
 * instead of a blank white screen. Next.js App Router convention.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production, this is where you'd send to Sentry.
    console.error('Aegis error boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass rounded-3xl p-8 max-w-md text-center">
        <div className="grid size-12 place-items-center rounded-full bg-destructive/15 text-destructive mx-auto mb-4">
          <ShieldAlert className="size-6" />
        </div>
        <h1 className="aegis-serif text-3xl mb-2">Something broke.</h1>
        <p className="text-sm text-muted-foreground mb-6">
          An unexpected error occurred. Your data is safe — Aegis runs locally.
          Try again, or refresh the page.
        </p>
        {error.digest && (
          <p className="text-[10px] text-muted-foreground aegis-mono mb-4">
            error id: {error.digest}
          </p>
        )}
        <div className="flex gap-2 justify-center">
          <Button variant="glass-primary" size="md-pill" onClick={reset}>
            Try again
          </Button>
          <Button variant="glass" size="md-pill" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      </div>
    </div>
  );
}
