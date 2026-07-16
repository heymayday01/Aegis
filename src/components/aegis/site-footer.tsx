'use client';

import * as React from 'react';
import { Shield } from 'lucide-react';

const FOOTER_BADGES = ['Local-first', '$0 infra', 'Open-source', 'MCP-ready'];

export function AegisSiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-card/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Left: wordmark + tagline */}
          <div className="flex items-start gap-3">
            <span className="grid size-8 place-items-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/30 shrink-0">
              <Shield className="size-4" strokeWidth={2.25} />
            </span>
            <div>
              <div className="text-sm font-semibold tracking-tight">Aegis</div>
              <p className="mt-0.5 text-xs text-muted-foreground max-w-xs leading-relaxed">
                A local-first trust &amp; redaction layer for AI. Verify, don’t trust.
              </p>
            </div>
          </div>

          {/* Right: badges + line */}
          <div className="flex flex-col items-start gap-3 md:items-end">
            <div className="flex flex-wrap gap-1.5">
              {FOOTER_BADGES.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center rounded-md border border-border/70 bg-background/40 px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  {b}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Built as a portfolio piece. Verify, don’t trust.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <div className="aegis-mono">
            v0.1.0 · SHA-256 hash-chained · zero server-side plaintext
          </div>
          <div className="flex items-center gap-3">
            <span>© {new Date().getFullYear()} Aegis</span>
            <span className="opacity-50">·</span>
            <span>Not affiliated with any AI vendor.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
