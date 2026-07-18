'use client';

import { GlassPanel } from './glass-panel';

const FOOTER_BADGES = ['Local-first', '$0 infra', 'Open-source', 'MCP-ready'];

/**
 * Site footer — a wide liquid-glass bar that closes the page.
 *
 * Layout:
 *   - Main row: shield-glyph wordmark (inline SVG, same as nav) + serif "Aegis"
 *     + tagline (left); glass-pill badges + tagline (right)
 *   - Bottom bar: mono version line + copyright + "Not affiliated"
 *
 * The page-level wrapper (`main { min-h-screen }`) pushes this footer below
 * the viewport when content is short; `mt-20` adds breathing room so it
 * doesn't collide with the last section's ambient overflow.
 */
export function AegisSiteFooter() {
  return (
    <footer className="mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-8">
        <GlassPanel className="rounded-t-3xl rounded-b-3xl p-8 sm:p-10">
          {/* Main row */}
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            {/* Left: shield-glyph wordmark + tagline */}
            <div className="flex items-start gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/30 shrink-0">
                {/* Same inline SVG shield as nav.tsx */}
                <svg
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </span>
              <div>
                <div className="aegis-serif text-2xl leading-none">Aegis</div>
                <p className="mt-2 text-xs text-muted-foreground max-w-xs leading-relaxed">
                  A local-first trust &amp; redaction layer for AI. Verify,
                  don&apos;t trust.
                </p>
              </div>
            </div>

            {/* Right: glass-pill badges + tagline */}
            <div className="flex flex-col items-start gap-3 md:items-end">
              <div className="flex flex-wrap gap-2">
                {FOOTER_BADGES.map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center glass rounded-full text-muted-foreground px-3 py-1 text-[11px] aegis-mono"
                  >
                    {b}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Built as a portfolio piece. Verify, don&apos;t trust.
              </p>
            </div>
          </div>

          {/* Bottom bar — mono version line + copyright */}
          <div className="mt-8 pt-4 border-t border-foreground/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <div className="aegis-mono flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-primary aegis-live-dot" />
              v0.1.0 · SHA-256 hash-chained · zero server-side plaintext
            </div>
            <div className="flex items-center gap-3 aegis-mono">
              <span>© {new Date().getFullYear()} Aegis</span>
              <span className="opacity-50">·</span>
              <span>Not affiliated with any AI vendor.</span>
            </div>
          </div>
        </GlassPanel>
      </div>
    </footer>
  );
}
