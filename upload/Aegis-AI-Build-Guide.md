# Aegis — AI Build Guide (Complete Execution Spec)

*This is the third and final doc in the set (Product Plan → Deployment Plan → this). Written specifically to be handed to an AI coding agent (Claude Code, Cursor, etc.) as its build instructions. Feed this whole file as context, execute one phase at a time, do not skip ahead.*

---

## 0. How To Use This Document

1. Give this entire file to your AI coding agent as project instructions (e.g. drop it in as `CLAUDE.md` or paste as the first message of a Claude Code session).
2. Execute **one phase at a time.** Do not let the agent jump ahead to Phase 3 while Phase 1 is unfinished.
3. After each phase, the agent must run that phase's **Acceptance Criteria** before moving on. If criteria fail, fix before continuing — don't accumulate debt across phases.
4. At each **🚦 Checkpoint**, stop and report back to the human (you) before continuing. These are the kill-criteria moments from the product plan — an AI should not self-approve past them.
5. If any instruction below conflicts with a constraint in Section 1, Section 1 always wins.

---

## 1. Non-Negotiable Constraints (apply to every phase, every file, no exceptions)

- **Zero paid AI subscriptions required to build, run, or use any part of this.** Detection runs locally; any optional LLM calls use free-tier APIs (Groq free / Gemini Flash free / OpenRouter free / local Ollama) and must support BYOK (bring-your-own-key) — never a shared key baked into the product.
- **Raw sensitive data must never leave the user's device/infrastructure unredacted.** No exceptions, no "just for logging," no "just for debugging."
- **No plaintext vault data (token↔value mappings) is ever stored server-side.** It lives client-side (extension) or within the customer's own infrastructure (SDK) only.
- **Every redaction event is logged in the tamper-evident hash chain.** No silent redactions.
- **TypeScript strict mode** across all TS code. **Full type hints** across all Python code.
- **No feature ships without a corresponding automated test.** A phase is not "done" until its tests pass.
- **Detection accuracy regressions block merges.** If a change drops precision/recall on the labeled test set, it fails CI — treat this as equivalent to a broken build.

---

## 2. Final Tech Stack (no ambiguity — do not substitute without flagging it to the human first)

| Layer | Choice |
|---|---|
| Monorepo tooling | pnpm workspaces + Turborepo |
| Versioning | changesets |
| Core engine language | TypeScript |
| Local NER | ONNX-exported distilled NER model + `onnxruntime-web` |
| Regex bank | Hand-authored, versioned pattern file (`packages/core/src/patterns/`) |
| Vault encryption | AES-256-GCM via Web Crypto API (browser) / Node `crypto` (SDK) |
| Dashboard | Next.js 14+, Prisma, Supabase, Tailwind CSS |
| Extension | Manifest V3, TypeScript, no framework (keep it light) |
| CI/CD | GitHub Actions |
| Hosting | Vercel (frontend) + Supabase (DB/auth), both free tier |
| Python SDK | Type-hinted Python 3.11+, packaged for PyPI |

---

## 3. Repository Bootstrap (Phase −1 — before any feature work)

The agent's first job, before writing any product logic:

```
aegis/
├── packages/
│   ├── core/
│   ├── sdk-node/
│   └── sdk-python/
├── apps/
│   ├── dashboard/
│   ├── website/          (empty until Phase 5 — do not scaffold yet)
│   └── extension/        (empty until Phase 4 — do not scaffold yet)
├── .github/workflows/
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```

**Acceptance criteria for Phase −1:**
- `pnpm install` runs clean from repo root
- `packages/core` has a working TypeScript build pipeline with zero source files yet (just config)
- A basic GitHub Actions workflow runs lint + typecheck on every PR, even with an empty codebase
- README states the project's one-line pitch and the non-negotiable constraints from Section 1

---

## 4. Phase 0 — Validate (do this before writing detection logic)

**Objective:** confirm the problem is real before building more.

**Tasks for the agent:**
- Scaffold a `docs/validation/` folder with a template for logging user interview notes (this is a human task, but the agent should prepare the structure)
- Build a minimal CLI script in `packages/core/scripts/test-detection.ts` that takes a text file and a list of hand-written test cases (email, API key, phone, credit card, custom glossary term) and reports pass/fail — this becomes the seed of the real test suite later

**🚦 Checkpoint — do not proceed to Phase 1 until:**
- At least 3 real people (developers or freelancers) have confirmed they'd actually use this
- The human has explicitly said "go" to Phase 1

---

## 5. Phase 1 — Core Detection Engine

**Objective:** build `@aegis/core` as a standalone, fully-tested TypeScript library. No UI, no server, nothing else depends on it yet.

**Core interfaces (implement exactly this contract):**

```typescript
export type EntityType =
  | 'EMAIL' | 'API_KEY' | 'PHONE' | 'CREDIT_CARD'
  | 'GOV_ID' | 'CUSTOM_GLOSSARY' | 'PERSON_NAME' | 'ORG';

export interface DetectionResult {
  entityType: EntityType;
  value: string;
  startIndex: number;
  endIndex: number;
  confidence: number; // 0.0 - 1.0
  source: 'regex' | 'ner' | 'glossary';
}

export interface Policy {
  strictness: 'paranoid' | 'balanced' | 'permissive';
  enabledEntityTypes: EntityType[];
  customGlossary: string[];
}

export interface RedactionResult {
  redactedText: string;
  tokenMap: Map<string, string>; // token -> original value
  detections: DetectionResult[];
}

export interface AuditLogEntry {
  timestamp: string;
  entityTypesRedacted: EntityType[]; // never the actual values
  destinationProvider: string;
  previousHash: string;
  currentHash: string;
}

export interface AegisCore {
  detect(text: string, policy: Policy): DetectionResult[];
  redact(text: string, detections: DetectionResult[]): RedactionResult;
  rehydrate(text: string, tokenMap: Map<string, string>): string;
  logAuditEntry(entry: Omit<AuditLogEntry, 'previousHash' | 'currentHash'>): AuditLogEntry;
}
```

**Build order within Phase 1:**
1. Regex bank first (`patterns/email.ts`, `patterns/apiKey.ts`, `patterns/phone.ts`, `patterns/creditCard.ts`, `patterns/govId.ts`) — each pattern file exports its own test cases alongside the pattern, so detection and tests never drift apart
2. `detect()` combining regex + glossary matching (skip NER model integration until this baseline is solid)
3. `redact()` and `rehydrate()` — reversible tokenization, round-trip tested (redact then rehydrate must always return the exact original text)
4. Hash-chained audit log (`logAuditEntry` — each entry's `previousHash` must equal the prior entry's `currentHash`; verify this with a dedicated "chain integrity" test that deliberately corrupts an entry and confirms it's detected)
5. NER model integration last, as an additive layer behind a feature flag — regex/glossary must work completely without it

**Acceptance criteria for Phase 1:**
- 100% of hand-written test cases from Phase 0's CLI script pass
- Round-trip test (redact → rehydrate) passes on a corpus of at least 50 varied text samples with zero data loss
- Hash chain integrity test passes (tampering is detected)
- Documented precision/recall numbers exist for each entity type — even if imperfect, they must be **honestly measured and written down**, not asserted

**🚦 Checkpoint — report the actual precision/recall numbers to the human before Phase 2. Do not round up or omit weak categories.**

---

## 6. Phase 2 — Developer SDK

**Objective:** wrap `@aegis/core` for real developer use. This ships before the extension — see Deployment Plan Section 3 for why.

**Node SDK contract:**

```typescript
// packages/sdk-node/src/index.ts
export function wrap<T extends (...args: any[]) => Promise<any>>(
  apiCall: T,
  policy?: Policy
): T;
// Usage: const safeCall = aegis.wrap(openai.chat.completions.create, myPolicy);
```

The wrapper must: detect + redact the outgoing payload's text fields, call the wrapped function with sanitized input, then rehydrate any echoed sensitive content in the response before returning it to the caller.

**Python SDK:** mirror the same contract idiomatically (`aegis.wrap(client.chat.completions.create, policy=my_policy)`), calling into the same core logic via a ported implementation or a WASM bridge — do not fork the detection logic into a second implementation that can drift from the TypeScript core.

**Acceptance criteria for Phase 2:**
- SDK correctly redacts before an outbound call and rehydrates the response, tested against a mocked API call (no real API key required for CI)
- Works with at least two different LLM provider client shapes (e.g. OpenAI-style and Anthropic-style call signatures) to prove it's provider-agnostic, not hardcoded to one SDK's shape
- README with a working code example a developer could copy-paste in under 2 minutes

**🚦 Checkpoint — do not proceed to Phase 3 until:**
- 3+ real developers confirm they'd add this to a project
- Precision/recall from Phase 1 meets a threshold the human is comfortable stating publicly
- If either fails: stop, fix the engine or the positioning — do not build the dashboard on a shaky core

---

## 7. Phase 3 — Audit Log + Team Dashboard

**Objective:** the actual monetizable surface.

**Build:**
- Next.js app in `apps/dashboard`, Prisma schema for: organizations, users, policies, audit log summaries (never raw redacted values)
- Auth via Supabase Auth
- Dashboard views: redaction history (entity types + counts, never values), policy editor (strictness, glossary terms), exportable compliance report (PDF/CSV)
- Multi-seat support: one org, multiple users, shared policy config

**Acceptance criteria for Phase 3:**
- A new org can sign up, invite a teammate, configure a policy, and see audit log entries populate from a real SDK integration
- Compliance report export produces a real, readable PDF/CSV with no placeholder data
- Deployed to a Vercel preview URL and manually verified end-to-end by the human

---

## 8. Phase 4 — Browser Extension

**Objective:** open-source trust/distribution surface, not the revenue engine.

**Build:**
- Manifest V3 extension in `apps/extension`, importing `@aegis/core` directly (same engine, no logic fork)
- Content scripts for ChatGPT, Claude, and Gemini web UIs
- Before sending: show the user exactly what's about to be redacted (a diff-style preview), require no click-through friction beyond what's necessary
- After response: rehydrate in-place

**Acceptance criteria for Phase 4:**
- Works end-to-end on all three target web UIs at time of build (accept that this will need maintenance as those UIs change — document this risk in the extension's README, don't hide it)
- Redaction preview is visible and understandable to a non-technical user in a manual test
- Zero network calls originate from the extension other than the page's own normal traffic to the AI provider — verify this manually in the browser's network tab and document the verification steps in the README so users can reproduce it themselves

---

## 9. Phase 5 — Launch

**Objective:** only start this phase once Phases 1-4 have real, if small, usage — not on a calendar deadline.

**Build:**
- `apps/website`: marketing/docs site, built last, showing real usage/screenshots rather than mockups
- Publish `@aegis/core`, `@aegis/sdk-node` to npm as `0.x.x`, `aegis-sdk` to PyPI, per the versioning strategy in the Deployment Plan
- Submit extension to Chrome Web Store and Edge Add-ons
- Open-source the full repo with a clear README, contribution guide, and security disclosure policy (a security tool needs a documented way for people to responsibly report issues — do not skip this)

**Acceptance criteria for Phase 5:**
- All packages installable by a stranger following only the public README, with no undocumented setup steps
- A security disclosure/contact method exists and is visible in the repo

---

## 10. Standing Rules for the AI Agent Across All Phases

- If a task requires paid infrastructure or a paid API key to complete, stop and flag it — do not silently substitute a workaround that breaks the free-tier constraint.
- If detection accuracy work starts trending toward "just add more regex patterns forever," stop and flag that the NER layer likely needs attention instead — don't let the regex bank become unmaintainable.
- If the agent is ever unsure whether something violates Section 1's constraints, treat it as a violation and ask, rather than proceeding on an optimistic interpretation.
- Write commit messages and PR descriptions that explain *why*, not just *what* — this repo is a portfolio artifact as much as a product, and its history should read like one.
