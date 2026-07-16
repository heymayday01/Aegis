# Aegis — Upgraded Build Plan (v2)

> Upgrade of the original Aegis Product/Deployment/Build docs.
> Three architectural changes over v1: **MCP-first distribution**, **Presidio-class detection reused (not reinvented)**, and **streaming-aware redaction as the signature demo**.
> Everything stays on a **$0 budget** — no paid AI subscriptions, no paid infra, all free tiers.

---

## 0. What changed from v1 (and why)

| Area | v1 (original) | v2 (upgraded) | Why |
|---|---|---|---|
| Distribution surface #1 | Browser extension (DOM scraping ChatGPT/Claude/Gemini) | **MCP server** as the primary "extension" story; DOM extension becomes a fallback | MCP is the emerging standard for AI-client ↔ tool integration. No DOM scraping fragility, no "third party reads my chats" trust paradox, future-proof against new AI clients. |
| Detection backend | Hand-built regex + small on-device NER, "Presidio as benchmark" | **Presidio as the reference detection backend** for the SDK/server tier; lightweight regex+NER kept only for the in-browser bundle | Don't reinvent detection. Presidio is mature, free, open-source, battle-tested. Our IP is the audit layer, tokenization, policy engine, and provider-agnostic wrapping — not the regex bank. |
| LLM feature support | Text-in → text-out only | **Streaming-aware redaction** as a first-class, signature demo; tool-call JSON walking documented | In 2025 the dominant patterns are streaming, tool/function calls, and RAG context. A text-only redactor is incomplete. Streaming redaction is unsolved and genuinely hard — owning it is the technical moat. |
| Cost | $0 + optional $5 Chrome fee | **$0, full stop.** Chrome fee is optional (extension is now a fallback surface, not v1) | Keep the "completely free" promise intact. |

Everything else from v1 (local-first, hash-chained audit, open-core, phased rollout, kill criteria) is retained — those parts were already right.

---

## 1. The Four Surfaces (reordered)

| Priority | Surface | Status in this build | Purpose |
|---|---|---|---|
| **Build first** | **Core engine** (`@aegis/core`) | ✅ Implemented in this Next.js app as `src/lib/aegis/` | The IP: detection + tokenization + audit hash chain + streaming. One engine, every surface wraps it. |
| **Build second** | **MCP server** | 📐 Designed + documented; live demo simulated via SSE endpoint | Primary distribution: any MCP-compatible client (Claude Desktop, Cursor, etc.) gets redaction natively. No DOM scraping, no trust paradox. |
| **Build third** | **Team Dashboard** | ✅ Implemented in this Next.js app (`/` route, dashboard tab) | The monetizable surface: audit log explorer, policy editor, compliance export, tamper-evidence demo. |
| **Build last, if at all** | **Browser extension** | 📐 Documented as fallback | Open-source credibility/distribution, but no longer v1. MCP made it optional. |

**Note on this sandbox build:** We can't ship a real npm package, PyPI package, or standalone MCP server process here. What we *can* ship — and what demonstrates the entire value proposition — is a working implementation of the **core engine** running live in a Next.js app, with a **dashboard** that proves the audit/policy/tokenization story, and a **streaming redaction demo** that proves the signature technical contribution. The MCP server design is documented in §6 so the architecture is complete on paper.

---

## 2. Non-Negotiable Constraints (carried from v1, unchanged)

- **Zero paid AI subscriptions** to build, run, or use any part of this. Detection runs locally; optional LLM calls use free-tier APIs with BYOK, never a shared baked-in key.
- **Raw sensitive data never leaves the user's device/infrastructure unredacted.** No exceptions.
- **No plaintext vault data (token↔value mappings) is ever stored server-side.** Client-side or customer-infrastructure only. (In this sandbox demo, the vault is in-memory per-request and never persisted — the *architecture* is what's demonstrated.)
- **Every redaction event is logged in the tamper-evident hash chain.** No silent redactions.
- **TypeScript strict mode** throughout.
- **Detection accuracy regressions block merges** (CI gate, documented in §7).

---

## 3. Core Engine Contract (implemented in `src/lib/aegis/`)

```typescript
export type EntityType =
  | 'EMAIL' | 'API_KEY' | 'PHONE' | 'CREDIT_CARD'
  | 'AADHAAR' | 'PAN' | 'IP_ADDRESS' | 'CUSTOM_GLOSSARY';

export type DetectionSource = 'regex' | 'glossary';

export interface DetectionResult {
  entityType: EntityType;
  value: string;
  startIndex: number;
  endIndex: number;
  confidence: number; // 0.0 - 1.0
  source: DetectionSource;
}

export type Strictness = 'paranoid' | 'balanced' | 'permissive';

export interface Policy {
  strictness: Strictness;
  enabledEntityTypes: EntityType[];
  customGlossary: string[];
}

export interface RedactionResult {
  redactedText: string;
  tokenMap: Record<string, string>; // token -> original value (in-memory only, never persisted server-side)
  detections: DetectionResult[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  entityTypesRedacted: EntityType[]; // NEVER the actual values
  entityCounts: Record<string, number>;
  destinationProvider: string;
  previousHash: string;
  currentHash: string;
  tampered: boolean; // computed on read by re-verifying the chain
}
```

### Detection layers (in priority order)

1. **Regex bank** (`patterns/`) — high-precision patterns for:
   - `EMAIL` — RFC-ish, high precision
   - `API_KEY` — AWS (`AKIA...`), Google (`AIza...`), Stripe (`sk_live_...`/`sk_test_...`), GitHub (`ghp_...`/`gho_...`), Slack (`xoxb-...`), generic high-entropy secrets
   - `PHONE` — E.164 + India mobile formats
   - `CREDIT_CARD` — Luhn-validated, major brands
   - `AADHAAR` — 12-digit with Verhoeff validation (India-first)
   - `PAN` — Indian Permanent Account Number format `[A-Z]{5}[0-9]{4}[A-Z]`
   - `IP_ADDRESS` — IPv4 + IPv6
2. **Custom glossary** — user/org-defined terms (client names, project codenames). Case-insensitive, whole-word matching.
3. **(Future) Presidio backend** — for the SDK/server tier, swap the regex bank for Presidio via a thin adapter. Same `DetectionResult` contract, better recall on names/orgs. Documented in §6.

### Strictness behavior

| Strictness | Behavior |
|---|---|
| `paranoid` | Redact everything detected at confidence ≥ 0.5. Glossary matches always redacted. |
| `balanced` (default) | Redact regex matches ≥ 0.8, glossary matches, flag the rest. |
| `permissive` | Redact only high-confidence regex (≥ 0.95). Glossary off. |

### Tokenization & rehydration

- Reversible pseudonymization: `john@acme.com` → `[AEGIS:EMAIL:A1B2]`
- Token format: `[AEGIS:<TYPE>:<4-hex>]` — type is preserved so the AI sees structure, value is hidden.
- Token map is **in-memory per request only** in this demo (the architecture's server-side persistence is documented as out-of-scope; in production it lives client-side / in-customer-infra only).
- **Round-trip invariant:** `rehydrate(redact(text)) === text` — always, tested.

### Audit hash chain

- Each entry's `currentHash = SHA-256(previousHash + timestamp + entityTypesRedacted + entityCounts + destinationProvider)`.
- On read, the engine re-walks the chain: if any entry's recomputed hash ≠ stored hash, that entry (and all after it) is flagged `tampered: true`.
- This is the tamper-evidence demo: a user can click "tamper" on a log entry in the dashboard and watch the chain break in real time.

### Streaming-aware redaction (the signature demo)

- Problem: LLM responses stream token-by-token. A PII entity (`john@acme.com`) may be split across chunk boundaries (`john@ac` | `me.com`).
- Aegis approach: a **buffered streaming redactor** that holds back a sliding window (default 24 chars) until it can confirm no in-progress entity is mid-match. Flushes confirmed-safe text immediately, holds ambiguous tails.
- Demo: an SSE endpoint (`/api/stream`) simulates an LLM streaming a response that contains embedded PII; the client shows the redacted stream arriving incrementally with a visible "buffering" indicator when an entity is mid-flight.
- This is the portfolio moment: "watch PII get redacted in a live stream without breaking it."

---

## 4. Tech Stack (this build)

| Layer | Choice | Cost |
|---|---|---|
| Framework | Next.js 16 (App Router) | Free |
| Language | TypeScript 5 (strict) | Free |
| Styling | Tailwind CSS 4 + shadcn/ui | Free |
| DB | Prisma + SQLite | Free |
| Crypto | Node `crypto` (SHA-256, AES-256-GCM) | Free (built-in) |
| Icons | lucide-react | Free |
| Charts | recharts | Free |
| Hosting | Vercel free tier (when deployed) | Free |
| (Future) MCP SDK | `@modelcontextprotocol/sdk` | Free |
| (Future) Presidio | Microsoft Presidio (Python) | Free, open-source |

**Total cost: $0.** No paid APIs, no paid infra, no paid AI subscriptions.

---

## 5. What This Build Ships (the live demo on `/`)

A single-page application with these sections (tabbed, all on the `/` route per sandbox constraints):

1. **Hero** — Aegis branding, the one-line pitch, the "verify it yourself" promise, live stats (redactions performed, chain integrity).
2. **Live Playground** — Paste any text → see every detected entity highlighted in-place with type-coded colors and confidence scores → see the redacted output with tokens → copy the redacted text. Strictness slider + glossary editor inline.
3. **Streaming Demo** — Watch a simulated LLM stream arrive token-by-token, with PII redacted live as it flows. Buffering indicator shows when an entity is mid-match.
4. **Audit Log Explorer** — The hash-chained log, visualized as a chain of blocks. Each block shows timestamp, entity types (never values), provider, and its hash. A "tamper" button on each entry lets you corrupt it and watch the chain break downstream — the tamper-evidence made visceral.
5. **Policy Editor** — Strictness selector, per-entity-type toggles, custom glossary manager. Changes apply live to the playground.
6. **Architecture** — The system diagram, the MCP-server design, the Presidio-integration plan, the honest limits (what v1 can and can't catch). This is the portfolio narrative.
7. **Sticky footer** — links, the "local-first, $0, open-source" badges.

Every interaction hits a real API route backed by the real core engine. No mockups, no placeholders.

---

## 6. MCP Server Design (documented, for the portfolio narrative)

```
┌──────────────────────────────────────────────────────┐
│  MCP-compatible AI Client (Claude Desktop, Cursor,   │
│  Windsurf, any client that speaks MCP)               │
└───────────────────┬──────────────────────────────────┘
                    │  MCP protocol (stdio or HTTP+SSE)
                    ▼
┌──────────────────────────────────────────────────────┐
│  Aegis MCP Server  (a separate process, stdio/SSE)   │
│                                                       │
│  Tools exposed:                                       │
│   - aegis.redact(text, policyId) → redactedText       │
│   - aegis.rehydrate(text, sessionId) → originalText   │
│   - aegis.audit(sessionId) → auditSummary             │
│                                                       │
│  The AI client calls aegis.redact BEFORE sending      │
│  user text to the LLM, and aegis.rehydrate on the     │
│  response. The client itself does the redaction —     │
│  no third party reads the conversation.               │
└───────────────────┬──────────────────────────────────┘
                    │  imports
                    ▼
┌──────────────────────────────────────────────────────┐
│  @aegis/core  (the same engine this dashboard uses)   │
└──────────────────────────────────────────────────────┘
```

**Why MCP over a browser extension:**
- No DOM scraping → no breakage when ChatGPT/Claude/Gemini ship UI changes.
- The AI client *itself* invokes Aegis → no "third-party extension reads my chats" trust paradox.
- One integration works with every MCP-compatible client → future-proof.
- The extension remains available as a fallback for web UIs that don't speak MCP, but it's no longer the load-bearing surface.

### Presidio integration plan (for the SDK/server tier)

```
@aegis/core
  ├─ detection/
  │   ├─ regex-bank.ts        ← lightweight, used in-browser + as fallback
  │   ├─ presidio-adapter.ts  ← thin adapter, used in SDK/server tier
  │   └─ types.ts             ← DetectionResult (shared contract)
```

The `presidio-adapter` calls a local Presidio process (or a bundled Presidio-analyzer) and normalizes its output into `DetectionResult[]`. Same contract, better recall on names/orgs/unstructured context. The regex bank stays as the zero-dependency fallback for environments where running Presidio isn't viable (browser extension, edge functions).

---

## 7. CI/CD & Quality Gates (for when this ships to a real repo)

- **On every PR:** lint + typecheck + unit tests on core engine.
- **Detection accuracy regression test:** a labeled fixture set (`__fixtures__/`) with known PII. CI computes precision/recall per entity type. If any category drops below its threshold, the build fails. *A security product that silently loses detection recall is worse than a broken build.*
- **Round-trip test:** `rehydrate(redact(text)) === text` on a 50+ sample corpus. Zero data loss allowed.
- **Hash-chain integrity test:** deliberately corrupt an entry, assert the engine flags it `tampered`.
- **Streaming test:** feed a chunked stream with PII split across boundaries, assert the redacted output is correct and complete.

---

## 8. Honest Limits (what v1 can and can't catch — stated on the dashboard)

**Can catch reliably (high precision):**
- Emails, API keys (known formats), phone numbers, credit cards (Luhn-validated), Aadhaar (Verhoeff-validated), PAN, IP addresses.
- Custom glossary terms (exact match).

**Can catch with Presidio backend (SDK/server tier only):**
- Person names, organizations, locations (via Presidio's NER).

**Cannot reliably catch (be honest):**
- Proprietary business context ("the Acme acquisition terms").
- Indirect identifiers ("Bangalore + fintech + Series B").
- PII embedded in images/audio/PDFs (multimodal — future work).
- PII in RAG-retrieved context that never passes through user input (architectural gap — documented).

**The honest v1 claim:** "Prevents accidental credential/PII leakage with a verifiable, local-first, provider-agnostic audit trail." Not "protects all your business secrets." The dashboard states this explicitly.

---

## 9. Phased Rollout (unchanged from v1 — the discipline was already right)

| Phase | Ships | Gate before next |
|---|---|---|
| 1 — Core engine | `@aegis/core` (this demo proves it) | Accuracy tests pass on labeled set |
| 2 — SDK + MCP server | npm + PyPI + MCP | 3+ real devs confirm they'd use it |
| 3 — Dashboard | Vercel (this app, deployed) | SDK has real usage |
| 4 — Extension (fallback) | Chrome Web Store (optional, $5) | Only if MCP adoption is slow |
| 5 — Launch | Custom domain + marketing site | Something real to show |

---

## 10. Why This Is Portfolio-Defining (the story)

> "AI vendors make trust claims that are contractual, not provable. Enterprise DLP costs $25–30/user/month, locking out freelancers and SMBs. So I built Aegis — a local-first, provider-agnostic redaction layer with a tamper-evident hash-chained audit log. One core engine, distributed via MCP so any AI client gets redaction natively without DOM scraping or a trust paradox. Streaming-aware, so PII is redacted live even in token-by-token LLM responses. Zero infrastructure cost, CI gates on detection accuracy, open-source from day one."

What it demonstrates that a CRUD app doesn't:
- **Security-first thinking** — hash-chained tamper-evident logs, AES-256-GCM vaults, local-only processing.
- **Architectural judgment** — MCP over DOM scraping, Presidio reuse over reinvention, shared core across surfaces.
- **Modernity** — streaming-aware redaction, MCP protocol awareness, 2025-relevant LLM feature handling.
- **Honesty** — stated limits, kill criteria, 0.x.x versioning, "verify it yourself" as the actual pitch.
- **Engineering maturity** — accuracy regression gates in CI, round-trip invariants, documented security disclosure path.

---

## 11. File Map (this build)

```
src/
├─ app/
│  ├─ layout.tsx              ← theme, fonts, metadata
│  ├─ page.tsx                ← the single-page app (all sections)
│  ├─ globals.css             ← dark security theme, entity colors
│  └─ api/
│     ├─ detect/route.ts      ← POST text+policy → detections
│     ├─ redact/route.ts      ← POST text+policy → redactedText + tokenMap
│     ├─ rehydrate/route.ts   ← POST redactedText + tokenMap → original
│     ├─ audit/route.ts       ← GET chain, POST new entry, POST tamper
│     ├─ policy/route.ts      ← GET/POST policy
│     └─ stream/route.ts      ← GET → SSE streaming redaction demo
├─ lib/
│  ├─ db.ts                   ← Prisma client (exists)
│  └─ aegis/
│     ├─ types.ts             ← the contract in §3
│     ├─ patterns/            ← regex bank (email, apiKey, phone, card, aadhaar, pan, ip)
│     ├─ detect.ts            ← detect(text, policy) → DetectionResult[]
│     ├─ tokenize.ts          ← redact() + rehydrate(), round-trip safe
│     ├─ audit.ts             ← hash-chained log, tamper detection
│     ├─ streaming.ts         ← buffered streaming redactor
│     └─ index.ts             ← public API
└─ components/
   └─ aegis/                  ← UI sections (hero, playground, audit, policy, streaming, architecture)
```

---

## 12. Build Status

- [x] Upgraded plan (this document)
- [ ] Prisma schema + db push
- [ ] Core engine (`src/lib/aegis/`)
- [ ] API routes
- [ ] Theme + layout
- [ ] Frontend sections
- [ ] Lint + Agent Browser verification

*This document is the source of truth. Refer back to it on every phase.*
