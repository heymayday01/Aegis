# Aegis — Deployment & Infrastructure Plan

*Companion doc to Aegis-Product-Plan.md. This covers how each surface actually ships, in what order, and at what cost — production-standard, still zero budget.*

---

## 1. Deployment Philosophy

Three rules govern every decision below:

1. **The core engine is the source of truth.** Every surface (SDK, dashboard, extension, future demo site) imports the same versioned package. Never fork logic between surfaces — one bug fix should fix it everywhere.
2. **Nothing gets deployed before it earns it.** Tie every deployment step to the kill-criteria checkpoints already defined in the product plan (Phase 0 validation, Phase 2 developer interest). Buying a domain or submitting to the Chrome Web Store before validation is wasted motion.
3. **Stay at $0 until real usage forces an upgrade.** Every service below has a free tier generous enough for pre-revenue traffic. The only real costs on this whole plan are optional and small.

---

## 2. Repository Structure

A single monorepo, not scattered repos — keeps the shared core engine genuinely shared instead of copy-pasted.

```
aegis/
├── packages/
│   ├── core/              → the detection + tokenization + audit engine (TypeScript)
│   ├── sdk-node/           → Node.js wrapper around core, published to npm
│   └── sdk-python/         → Python wrapper around core (calls a compiled/ported version, or a WASM bridge), published to PyPI
├── apps/
│   ├── dashboard/          → Next.js + Prisma + Supabase (team tier)
│   ├── website/             → marketing/docs site (built later, once SDK has traction)
│   └── extension/           → Manifest V3 browser extension (Phase 4)
├── .github/workflows/       → CI/CD pipelines
└── turbo.json / pnpm-workspace.yaml
```

**Tooling:** `pnpm` workspaces + `Turborepo` for build orchestration, `changesets` for versioning multiple packages from one repo without version-drift headaches. All free, all open-source.

---

## 3. Where Each Surface Actually Deploys

| Surface | Deployment target | Cost | Gate before shipping |
|---|---|---|---|
| `@aegis/core` | npm registry (public package) | Free | Detection accuracy meets your own stated threshold on the labeled test set |
| `@aegis/sdk-node` | npm registry | Free | Core is published and stable |
| `aegis-sdk` (Python) | PyPI | Free | Same as above, ported/wrapped |
| Team Dashboard | Vercel (frontend) + Supabase (DB/auth) | Free tier, both | 3+ real developers confirmed they'd use the SDK (Phase 2 checkpoint) |
| Browser Extension | Chrome Web Store + Edge Add-ons | **$5 one-time** Chrome developer registration fee | Dashboard + SDK both have real, if early, usage |
| Marketing/docs website | Vercel, static/Next.js | Free (domain optional, ~₹800–1,200/yr if you want a custom one) | Only build once SDK has something real to show — don't build a homepage for a product with zero users |

**The one honest cost on this entire plan is the $5 Chrome developer fee and an optional yearly domain. Everything else is genuinely free at this stage.**

---

## 4. CI/CD Pipeline (GitHub Actions — free for public repos)

```
On every pull request:
  → lint + typecheck + unit tests on packages/core
  → build check on all apps (dashboard, extension)
  → detection accuracy regression test (fail the build if precision/recall drops)

On merge to main:
  → auto-deploy apps/dashboard to Vercel (preview URL first, promote to prod manually)
  → auto-deploy apps/website to Vercel (once it exists)

On version tag (via changesets):
  → auto-publish @aegis/core, @aegis/sdk-node to npm
  → auto-publish aegis-sdk to PyPI
  → auto-generate changelog
```

Why the accuracy regression test matters more than typical CI: this is a security product. A refactor that quietly drops detection recall is worse than a failed build — it's a silent trust violation. Treat it as a release blocker, not a warning.

---

## 5. Environments

| Environment | Purpose | Where |
|---|---|---|
| **Local** | Development, full test suite | Your machine |
| **Preview** | Every PR gets an auto-deployed preview URL | Vercel (free, automatic) |
| **Staging** | Pre-release smoke test for the dashboard, using seeded fake data | Vercel (separate project or branch deploy) |
| **Production** | Real users, real (encrypted) data | Vercel + Supabase, promoted manually from staging |

Never let real user data exist in staging. Seed it with synthetic data only — this matters more than usual given the product's entire premise is data trust.

---

## 6. Secrets & Security Hardening

- **Vault keys never touch your servers.** The token↔value mapping for redaction is generated and stored client-side (browser extension) or within the customer's own infrastructure (SDK). Your dashboard backend should only ever see redacted tokens and metadata — if you can technically see a customer's raw sensitive data, the entire trust pitch is void. Architect this constraint in from day one, not as a later hardening pass.
- **Environment variables** (Supabase keys, any signing secrets) live in Vercel's encrypted env var store — never committed, never logged.
- **Dependency scanning**: enable GitHub Dependabot (free) — a security product with a vulnerable dependency is an actual liability, not just bad optics.
- **Rate limiting** on any dashboard API routes (Vercel Edge Config or Supabase RLS policies) to prevent abuse of the free tier itself.
- **CSP headers** on the dashboard and future website — standard hardening, costs nothing, signals seriousness in a portfolio review.

---

## 7. Observability (free tier, but real)

| Need | Tool | Cost |
|---|---|---|
| Error tracking | Sentry (free tier) | Free up to reasonable volume |
| Uptime monitoring | UptimeRobot or Better Uptime free tier | Free |
| Web analytics (privacy-respecting, fits the brand) | Vercel Analytics or Plausible free trial | Free/low |
| Audit log integrity checks | Custom — verify the hash chain hasn't broken, run as a scheduled GitHub Action | Free |

A security-positioned product that doesn't monitor its own uptime or errors undercuts its own credibility. Budget an afternoon for this before calling any phase "done."

---

## 8. Versioning & Release Strategy

- **Semantic versioning** across all packages, managed via `changesets` so a fix in `core` correctly bumps dependent packages.
- **Ship the SDK as `0.x.x` (beta) publicly** — this is honest, not weak. A security tool claiming `1.0.0` stability before it has real-world usage is a bigger credibility risk than an honestly-labeled beta.
- **Promote to `1.0.0`** only after the Phase 2 kill-criteria checkpoint passes *and* it's been running against real integrations for a few weeks without a detection regression.

---

## 9. Rollout Sequencing (mapped to the product plan's phases)

| When | What ships | What it requires first |
|---|---|---|
| End of Phase 1 | `@aegis/core` published to npm as `0.1.0-beta` | Passing accuracy tests on the labeled set |
| End of Phase 2 | `@aegis/sdk-node` + Python SDK published | Core stable, 3+ real developer interest confirmed |
| End of Phase 3 | Dashboard live on a Vercel subdomain (`aegis.vercel.app`) | SDK has real, even if small, usage |
| End of Phase 4 | Browser extension submitted to Chrome Web Store | Dashboard + SDK both functioning end-to-end |
| Phase 5 | Custom domain purchased, marketing/docs site goes live, public launch (Product Hunt, dev communities) | Something real to actually show — not before |

**The discipline here is the point:** don't buy a domain in week one, don't build a marketing site before there's a product, don't submit to the Chrome Web Store before the core engine has proven itself. Every deployment step is earned by the checkpoint before it, not scheduled by calendar time.

---

## 10. Total Cost Summary

| Item | Cost |
|---|---|
| npm + PyPI publishing | Free |
| GitHub (public repo + Actions) | Free |
| Vercel (dashboard + future website) | Free tier |
| Supabase (DB + auth) | Free tier |
| Sentry, UptimeRobot | Free tier |
| Chrome Web Store developer account | $5 one-time |
| Custom domain (optional, later) | ~₹800–1,200/year |

**Realistic total spend to reach a fully deployed, production-hardened v1: under ₹1,500, and most of that is optional.**
