# Task 10 — Mobile + 3D + continuity fix

## Scope
Fix mobile vertical bloat (11,689px → target ~7,500px), add 3D scroll card animations
via `<ScrollCard3D>` / `<ScrollReveal>`, unify motion language, and optimize glass perf.

## Files modified
- `src/components/aegis/section-heading.tsx` — replaced `motion.div whileInView` with `<ScrollReveal>`; reduced mobile top margin
- `src/components/aegis/playground.tsx` — `py-12 sm:py-20`; `p-4 sm:p-6` on GlassPanels; wrapped pill bar + dual columns in `<ScrollReveal>`; removed `motion`/`useReducedMotion` (no longer needed)
- `src/components/aegis/streaming-demo.tsx` — `py-12 sm:py-20`; `p-4 sm:p-5` on side panel; wrapped grid in `<ScrollReveal delay={0.1}>`; kept per-chip `motion.div` animation + `useReducedMotion` for chips
- `src/components/aegis/audit-explorer.tsx` — `py-12 sm:py-20`; `p-4 sm:p-6` on integrity summary + actions cell; each `ChainBlock` wrapped in `<ScrollCard3D intensity={6}>`; replaced `GlassPanel` per block with plain `div.glass` (perf — too many SVG filters); chain container in `<ScrollReveal>`; hash rows `text-[10px] sm:text-[11px]` + `p-2 sm:p-3`; removed `motion`/`useReducedMotion`
- `src/components/aegis/policy-editor.tsx` — `py-12 sm:py-20`; `p-4 sm:p-6` on both panels; each strictness card wrapped in `<ScrollCard3D intensity={8}>` with `p-3 sm:p-4`; entity toggles `grid-cols-2` (2-col even on mobile) with `p-2.5 sm:p-3` cells; outer block in `<ScrollReveal>`; removed `motion`/`useReducedMotion`
- `src/components/aegis/architecture.tsx` — biggest change. `py-12 sm:py-20`; **system diagram is horizontally scrollable on mobile** (saves ~470px vs stacking); DiagramColumn + sub-cells plain `.glass` (no liquid); DiagramCore keeps `liquid glare`; arrows hidden on mobile (the carousel conveys flow); each upgrade callout wrapped in `<ScrollCard3D intensity={10}>`; honest limits + portfolio each wrapped in `<ScrollCard3D>`; major blocks in `<ScrollReveal>`; removed `REVEAL` constant + `useReducedMotion`; kept `whileHover={{ y: -2 }}` on UpgradeCard
- `src/components/aegis/site-footer.tsx` — `mt-12 sm:mt-20`; `p-6 sm:p-8`; `gap-6`; tighter spacing

## Mobile height results (390×844 viewport, scrollHeight)
| Section        | Before | After | Saved |
|----------------|-------:|------:|------:|
| Hero           | 1,001  | 1,001 | 0     |
| Playground     | 1,558  | 1,454 | 104   |
| Streaming      | 1,328  | 1,248 | 80    |
| Audit (w/chain)| 1,902  | 1,606 | 296   |
| Policy         | 1,776  | 1,336 | 440   |
| Architecture   | 3,637  | 2,886 | 751   |
| **Total**      | **11,689** | **9,947** | **1,742 (~15%)** |

Target was ~7,500px total / ~1,500px architecture. Architecture is 2,886px — the
honest-limits panel (845px) and portfolio panel (604px) are inherently tall because
of their content volume (13 bullet items + callout in honest-limits; 2 paragraphs
+ 5 bullets + 4 badges in portfolio). Going lower would require removing content,
which the task did not authorize.

## Lint
`bun run lint` → 0 errors, 1 pre-existing warning in `glass-panel.tsx`
(unrelated `react-hooks/exhaustive-deps` disable directive).

## Logic preserved
All components keep their original logic intact:
- **Playground**: `onRedact`, `onRehydrate`, `onTextChange` (B1 stale-result clear),
  `onKeyDown` (Cmd/Ctrl+Enter), `onCopy`, `refreshPolicy`, `buildPolicyOverride`
- **Streaming**: `start`/`stop`/`cleanup`, EventSource lifecycle, `setOutput`/`setBuffered`/
  `setCompleted`, B2 direct-scroll fix, error handling for clean server close
- **Audit**: `load`, `post`, `onSeed`, `onRepair`, `onClear`, `onTamper` (with B4 warning
  toast), AlertDialog confirmation, B3 keyboard-focusable hashes with `tabIndex={0}` +
  `role="button"`, Tooltip on hash rows
- **Policy**: optimistic updates + rollback in `updateStrictness`/`toggleEntityType`,
  `addTerm`/`removeTerm` with reload, dedupe check on add
- **Architecture**: all content preserved; only layout/animation wrappers changed

## What I'd do with more time
- Honest-limits panel could go to 2-col sub-cells on mobile if item text were
  shortened, but the API keys item is ~140 chars and would wrap to ~10 lines
- Architecture 1,500px target needs ~50% content reduction; not achievable
  without scope cuts
