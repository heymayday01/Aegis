'use client';

const FOOTER_BADGES = ['Local-first', '$0 infra', 'Open-source', 'MCP-ready'];

/**
 * Site footer — the colophon. Hard-edged editorial closing.
 *
 * Layout:
 *   - Top strip: "COLOPHON" eyebrow + live "engine online" indicator
 *   - Main row: shield-glyph wordmark (inline SVG, same as nav) + serif "Aegis"
 *     + tagline (left); hard-edged badge pills + tagline (right)
 *   - Bottom bar: border-t, mono version line + copyright + "Not affiliated"
 *
 * Keeps mt-auto so it sticks to the viewport bottom when content is short
 * and pushes naturally when content overflows (sticky footer requirement).
 */
export function AegisSiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-card/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Colophon header strip */}
        <div className="flex items-center justify-between border-b border-border py-4">
          <span className="aegis-eyebrow text-muted-foreground">Colophon</span>
          <span className="aegis-mono text-[10px] text-muted-foreground flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-primary aegis-live-dot" />
            engine online
          </span>
        </div>

        {/* Main row */}
        <div className="py-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          {/* Left: shield-glyph wordmark + tagline */}
          <div className="flex items-start gap-3">
            <span className="grid size-8 place-items-center bg-primary/12 text-primary ring-1 ring-primary/30 shrink-0">
              {/* Same inline SVG shield as nav.tsx */}
              <svg
                viewBox="0 0 24 24"
                className="size-4"
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
              <div className="aegis-serif text-xl leading-none">Aegis</div>
              <p className="mt-1.5 text-xs text-muted-foreground max-w-xs leading-relaxed">
                A local-first trust &amp; redaction layer for AI. Verify, don’t trust.
              </p>
            </div>
          </div>

          {/* Right: hard-edged badges + tagline */}
          <div className="flex flex-col items-start gap-3 md:items-end">
            <div className="flex flex-wrap gap-1.5">
              {FOOTER_BADGES.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center border border-border text-muted-foreground px-2 py-0.5 text-[11px] aegis-mono"
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

        {/* Bottom bar — mono version line + copyright */}
        <div className="border-t border-border py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <div className="aegis-mono">
            v0.1.0 · SHA-256 hash-chained · zero server-side plaintext
          </div>
          <div className="flex items-center gap-3 aegis-mono">
            <span>© {new Date().getFullYear()} Aegis</span>
            <span className="opacity-50">·</span>
            <span>Not affiliated with any AI vendor.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
