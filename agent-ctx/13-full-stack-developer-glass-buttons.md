# Task ID: 13 — Upgrade all buttons to liquid-glass variants

**Agent:** full-stack-developer (glass buttons)
**Date:** 2026 upgrade pass

## Scope

Upgrade all `<Button>` usages in the Aegis liquid-glass website to use the new
glass variants defined in `src/components/ui/button.tsx`:
- `glass` — tinted glass material, rounded-full, hover brightens + shadow
- `glass-strong` — stronger glass (more tint + shadow)
- `glass-primary` — glass with mint accent fill, for CTAs
- Pill sizes: `lg-pill` (h-11), `md-pill` (h-9), `sm-pill` (h-8), `icon-sm` (size-8)

## Files changed + variants applied

### 1. `src/components/aegis/playground.tsx` (6 buttons)
- **Sync**: `ghost/sm` → `glass/sm-pill` (removed `rounded-full active:scale-[0.97]`)
- **Sample**: `ghost/sm` → `glass/sm-pill` (removed `rounded-full active:scale-[0.97] hover:bg-foreground/5`)
- **Clear**: `ghost/sm` → `glass/sm-pill` (removed `rounded-full active:scale-[0.97] hover:bg-foreground/5`)
- **Redact** (CTA): default/h-11 → `glass-primary/lg-pill` (removed `h-11 rounded-full active:scale-[0.98]`; kept `mt-4 self-start group`)
- **Copy** (icon): `ghost/icon` → `glass/icon-sm` (removed `size-8 rounded-full hover:bg-foreground/10`)
- **Rehydrate**: `secondary/sm` → `glass/sm-pill` (removed `rounded-full active:scale-[0.98]`)

### 2. `src/components/aegis/streaming-demo.tsx` (2 buttons)
- **Start stream** (CTA): default/h-9 → `glass-primary/md-pill` (removed `h-9 rounded-full active:scale-[0.98]`)
- **Stop**: `destructive/sm` → `destructive/md-pill` (removed `h-9 rounded-full active:scale-[0.98]`; kept destructive variant per task — deliberate interrupt action)

### 3. `src/components/aegis/audit-explorer.tsx` (7 buttons)
- **Seed demo entries** (actions cell, CTA): default/h-10 → `glass-primary/md-pill`
- **Seed demo entries** (empty state, CTA): default/h-10 → `glass-primary/md-pill` (kept `mt-2`)
- **Repair chain**: `ghost/sm` → `glass/sm-pill`
- **Re-verify**: `ghost/sm` → `glass/sm-pill`
- **Clear** (AlertDialogTrigger): `ghost/sm` → `glass/sm-pill` (kept `text-destructive` for warning color; removed `h-10 rounded-full hover:bg-destructive/10 active:scale-[0.98]`)
- **Tamper this**: `ghost/sm` → `glass/sm-pill` (kept `text-[10px] sm:text-[11px] text-muted-foreground hover:text-destructive`; removed `h-8 px-3 rounded-full hover:bg-destructive/10 active:scale-[0.96] focus-visible:*`)
- **AlertDialogAction** ("Clear chain" confirm): kept as-is — destructive styling via className (AlertDialogAction uses `buttonVariants()` default + className; not a glass context). Per task: "keep variant="destructive" (it's in a dialog, not glass context)"

### 4. `src/components/aegis/policy-editor.tsx` (1 button)
- **Add** (glossary form submit, CTA): default/h-9 → `glass-primary/sm-pill` (removed `h-9 rounded-full active:scale-[0.98]`)
- Strictness radio cards (`<button>`): left as-is per task
- Glossary remove X (`<button>`): left as-is per task

### 5. `src/components/aegis/nav.tsx` (1 button)
- **Mobile toggle**: `ghost/icon` → `glass/icon-sm` (removed `size-9 rounded-full hover:bg-foreground/10`; kept `md:hidden relative`)
- GitHub link (`<a>`): left as-is per task

## Total buttons upgraded: 17

## Rules followed
- Only changed `variant`, `size`, and `className` props.
- Removed redundant classes covered by the variant (`rounded-full`, `active:scale-[0.97]`, `active:scale-[0.98]`, `size-9`, `h-9`, `h-10`, `h-11`, hover backgrounds).
- Kept `className` only for what the variant doesn't cover: text colors (`text-destructive`, `text-muted-foreground`, `hover:text-destructive`), positioning (`mt-2`, `mt-4`, `self-start`), layout (`md:hidden`, `relative`), text size overrides (`text-[10px] sm:text-[11px]`), and group/icon-transition classes (`group`).
- Did NOT add `useLiquidGlass` to any button — the `.glass` CSS class provides the glass material without SVG refraction (per the rules: "buttons are too small and too numerous for real refraction").
- Kept ALL onClick handlers, disabled states, loading spinners, aria-labels, and other behavior intact.

## Stage Summary
- **Lint**: PASS (0 errors). 4 pre-existing warnings in `dot-matrix-background.tsx` (unrelated to this task — not touched).
- **Buttons upgraded**: 17
