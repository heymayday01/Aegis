import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldQuestion } from 'lucide-react';

/**
 * 404 page — Next.js App Router convention.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass rounded-3xl p-8 max-w-md text-center">
        <div className="grid size-12 place-items-center rounded-full bg-primary/15 text-primary mx-auto mb-4">
          <ShieldQuestion className="size-6" />
        </div>
        <h1 className="aegis-serif text-5xl mb-2">404</h1>
        <p className="text-sm text-muted-foreground mb-6">
          This page doesn&apos;t exist. Aegis only has one route — the home page.
        </p>
        <Link href="/">
          <Button variant="glass-primary" size="md-pill">
            Back to Aegis
          </Button>
        </Link>
      </div>
    </div>
  );
}
