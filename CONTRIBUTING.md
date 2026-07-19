# Contributing to Aegis

Thanks for your interest in improving Aegis! This is a portfolio project, but contributions are welcome.

## Development setup

```bash
# Clone
git clone https://github.com/heymayday01/Aegis.git
cd aegis

# Install dependencies
bun install

# Set up the database
cp .env.example .env
bun run db:push

# Start the dev server
bun run dev
```

Open `http://localhost:3000`.

## Project structure

```
src/
├─ app/           # Next.js App Router (pages + API routes)
├─ components/
│  ├─ aegis/     # Product UI components
│  └─ ui/        # shadcn/ui primitives
├─ lib/
│  ├─ aegis/     # Core engine (detection, tokenization, audit, streaming)
│  ├─ db.ts      # Prisma client
│  └─ liquid-glass.ts  # SVG refraction module
└─ prisma/       # Database schema
```

## Core engine contract

The engine lives in `src/lib/aegis/` and follows the contract in `types.ts`:

- `detect(text, policy)` → `DetectionResult[]`
- `redact(text, policy)` → `{ redactedText, tokenMap, detections }`
- `rehydrate(redactedText, tokenMap)` → `string` (must satisfy `rehydrate(redact(x)) === x`)
- `appendAuditEntry({ entityTypesRedacted, entityCounts, ... })` → `AuditLogEntry`

**Non-negotiable constraints** (see `AEGIS-UPGRADED-PLAN.md`):
- Raw sensitive data never leaves the device unredacted
- No plaintext vault data is stored server-side
- Every redaction event is logged in the hash chain
- `rehydrate(redact(x)) === x` always

## Adding a new entity type

1. Add the type to `EntityType` in `src/lib/aegis/types.ts`
2. Add a pattern module in `src/lib/aegis/patterns/`
3. Export it from `src/lib/aegis/patterns/index.ts`
4. Add `ENTITY_META` entry (label, color, description)
5. Update `ALL_ENTITY_TYPES` if needed
6. Test with the playground

## Code style

- **TypeScript strict mode** — no `any` where avoidable
- **Use existing shadcn/ui components** — don't rebuild from scratch
- **Run `bun run lint`** before submitting — must pass with zero errors
- **Commit messages**: `type: description` (e.g., `feat: add SSN detection`, `fix: streaming buffer edge case`)

## Detection accuracy

If you add or modify detection patterns:
- **Do not lower precision/recall** on the existing test set
- Document any new false positives or false negatives
- The CI accuracy regression test (planned) will block merges that drop detection quality

## Pull request process

1. Fork → branch (`feat/...` or `fix/...`)
2. Ensure `bun run lint` passes
3. Ensure the playground, streaming, audit, and policy sections still work
4. Open a PR with a clear description of what + why

## License

By contributing, you agree your contributions are licensed under the MIT License.
