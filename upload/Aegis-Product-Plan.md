# Aegis — Local-First Trust & Redaction Layer for AI
### Complete Product & Architecture Plan

*Working name: **Aegis** (Greek: a shield of protection). Rename freely — this doc treats the name as a placeholder.*

---

## 1. One-Line Pitch

Aegis sits between any person or app and any AI provider, strips sensitive data **before it ever leaves the device**, and gives a cryptographically provable audit trail of exactly what was sent where — turning "trust us, we don't train on your data" into "verify it yourself."

---

## 1.5 Reality Check — Read This Before Building Anything

This section exists because a plan that only says "this will work" isn't a real plan. Five things will actively fight you:

1. **Detection has a hard ceiling.** Structured data (emails, keys, card numbers) is catchable with high precision. Unstructured business context (the thing people actually worry about most) is not reliably catchable by a small on-device model. **Do not market v1 as "protects your business secrets."** Market it honestly as "prevents accidental credential/PII leakage" — a narrower, achievable, still-valuable claim.
2. **The trust paradox**: asking someone to install a third-party extension that reads their AI conversations is itself a large trust ask. Mitigate with open source from day one, zero background network calls (verifiable in the browser's own network tab), and radical transparency about exactly what the extension can and can't see.
3. **Redaction can degrade the AI's usefulness.** This is a real tradeoff, not a bug to eliminate — the plan below designs around it rather than pretending it away.
4. **DOM-scraping a browser UI is fragile and high-maintenance.** This is the main reason the plan below leads with the SDK, not the extension.
5. **Funded competitors exist.** Don't try to out-enterprise Nightfall/Skyflow/Purview. Win the segment they ignore: individual developers and small teams shipping AI features who can't afford or justify an enterprise DLP contract.

**Revised honest goal:** build this primarily as a technically serious portfolio piece with a real, narrow, achievable claim. Treat revenue as upside, not the success metric. If it also makes money — great, and the plan below gives it a real shot — but don't bet your runway on it.

---

## 2. The Problem (why this matters, stated plainly)

- Companies cannot verify an AI vendor's claim that their data isn't used for training — the promise is contractual, not provable.
- Employees leak proprietary data through personal AI accounts constantly, without realizing it, because nothing stops them at the point of input.
- Anonymization alone is no longer reliable — modern models can re-identify people from "anonymized" data via behavioral correlation.
- Enterprise-grade protection (Zero Data Retention contracts, DPAs) costs $25–30/user/month — completely unreachable for freelancers, students, and small agencies who need it just as much.
- Regulation is tightening fast (EU AI Act high-risk enforcement from Aug 2026, Colorado AI Act, CPRA) — demand for provable compliance is only going up.

**The gap Aegis fills:** nobody has built a *verifiable, local-first, provider-agnostic* trust layer for the people who can't afford enterprise contracts. That's freelancers, students, small agencies, indie devs — a massive, completely unserved market.

---

## 3. Product Shape (3 surfaces, 1 core engine — reordered by what's actually viable first)

| Priority | Surface | Who it's for | What it does |
|---|---|---|---|
| **Build first** | **Developer SDK** | Devs embedding AI features into their own apps (a SaaS adding an AI chatbot, a startup calling an LLM API with user data) | Drop-in middleware wrapping any LLM API call with redaction + audit. No DOM-scraping fragility, no browser-permissions trust problem, and it's a real, definable customer with budget. |
| **Build second** | **Team Dashboard** | Small agencies/SMBs (paid tier) | Central policy config, audit log viewer, exportable compliance reports — this is where revenue actually lives |
| **Build third, if at all** | **Browser Extension** | Individuals (freelancers, students) | Same engine, applied to ChatGPT/Claude/Gemini web UIs — valuable for distribution and open-source credibility, but treat it as a trust-building/marketing surface, not the revenue engine |

**Why the reorder matters:** the SDK sidesteps two of the five real flaws above (fragile DOM-scraping, the browser-extension trust paradox) and targets a customer who actually has budget — a company shipping an AI feature, not an individual freelancer. The extension is still worth building eventually because it's a strong open-source distribution/credibility play, but it shouldn't be v1.

All three sit on top of **one shared core engine** — this is the actual IP, and the reason this is "small but exponential": build the engine once, ship it three ways.

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        INPUT SURFACES                       │
│  Browser Extension (content script)  │  SDK (Node/Python)   │
└──────────────┬────────────────────────────────┬─────────────┘
               │                                │
               ▼                                ▼
        ┌─────────────────────────────────────────────┐
        │            AEGIS CORE ENGINE                 │
        │                                               │
        │  1. Detection Layer                          │
        │     - Regex pattern bank (keys, emails, IDs) │
        │     - Local NER classifier (on-device)       │
        │     - Custom policy glossary (org-specific)  │
        │                                               │
        │  2. Tokenization Layer                       │
        │     - Reversible pseudonymization            │
        │     - Encrypted local vault (token ↔ value)  │
        │                                               │
        │  3. Policy Engine                            │
        │     - Sensitivity rules, strictness levels   │
        │     - Per-provider routing decisions         │
        │                                               │
        │  4. Audit Layer                              │
        │     - Hash-chained, tamper-evident log        │
        │     - Local-first, exportable                │
        └──────────────┬────────────────────────────────┘
                        │  (only sanitized text leaves here)
                        ▼
        ┌─────────────────────────────────────────────┐
        │     ANY AI PROVIDER (ChatGPT/Claude/Gemini/  │
        │     Groq/OpenRouter/local Ollama)             │
        └──────────────┬────────────────────────────────┘
                        │  (response comes back, still tokenized)
                        ▼
        ┌─────────────────────────────────────────────┐
        │          REHYDRATION LAYER                   │
        │  Swaps tokens back to real values for the    │
        │  user's eyes only — never sent anywhere      │
        └─────────────────────────────────────────────┘
```

**Core design principle:** raw sensitive data never crosses the network boundary. Detection, tokenization, and rehydration all happen on the user's device or inside their own infrastructure (for the SDK/team tier). Aegis's own servers (if any exist at all) should ideally never see plaintext — only anonymized telemetry, if the user opts in.

---

## 5. Component Deep-Dive

### 5.1 Detection Layer
- **Regex bank**: high-precision patterns for API keys, credit card numbers, emails, phone numbers, government ID formats (Aadhaar, PAN for India-first launch), IP addresses, credentials.
- **Local NER classifier**: a small, distilled NER model (ONNX-exported, run via `onnxruntime-web` or `transformers.js` in-browser) to catch names, organizations, and proprietary terms that regex can't. Keep it small (<50MB) so it loads fast in a browser extension.
- **Custom glossary**: user/org-defined sensitive terms (client names, project codenames, internal product names) — this is what makes it genuinely useful for freelancers with NDAs, not just generic PII.
- **Confidence tiers**: auto-redact (high confidence), flag-for-review (medium), ignore (low) — avoids destroying usability with over-redaction.

### 5.2 Tokenization Layer
- Reversible pseudonymization: `john@acme.com` → `[EMAIL_TOKEN_A1]`
- Token↔value map stored in an encrypted local vault (AES-256-GCM), key derived from OS keychain (Chrome's `chrome.storage` + Web Crypto API for the extension; OS keyring for the SDK/Node version).
- Vault never syncs to any server by default — this is the trust claim, and it needs to be literally true, not just marketed.

### 5.3 Audit Layer
- Every redaction event is logged: timestamp, entity type redacted (not the value itself), destination provider, hash of the previous log entry.
- Hash-chaining (each entry includes a hash of the prior entry) makes the log **tamper-evident** — if anyone edits a past entry, every subsequent hash breaks. This is a genuinely strong, interview-worthy design choice and costs almost nothing to implement.
- Exportable as a compliance report (CSV/PDF) for the team tier — this is what actually gets sold to SMBs.

### 5.4 Policy Engine
- Strictness levels (Paranoid / Balanced / Permissive) so users control the tradeoff between safety and friction.
- Per-provider rules — e.g., "always redact before sending to any non-Anthropic/OpenAI enterprise endpoint," useful once teams mix free-tier and paid-tier usage.

---

## 6. Tech Stack (production-grade, zero-cost to build and run)

| Layer | Choice | Why |
|---|---|---|
| Browser extension | Manifest V3, TypeScript | Required by Chrome/Edge now; TS keeps it maintainable |
| Local NER | ONNX-exported distilled model + `onnxruntime-web` | Runs fully client-side, no API cost, no data leaves device |
| SDK/middleware | Node.js + Python packages (npm + PyPI) | Covers both JS and Python backend ecosystems |
| Detection reference | Microsoft Presidio (open-source) | Use as a benchmark/backend option for the heavier SDK version where a server-side Python process is acceptable |
| Vault/storage | IndexedDB (extension) / SQLite (SDK), AES-256-GCM | Local-only, no infra cost |
| Dashboard (team tier) | Next.js + Prisma + Supabase | Your existing, proven stack from AVYSTRA |
| Audit log | Hash-chained JSON log, exportable | Simple, auditable, no external dependency |
| Hosting (dashboard only) | Vercel free tier + Supabase free tier | Zero cost until real paying users justify upgrading |

Nothing in this stack requires a paid AI subscription — the entire detection pipeline is local/open-source by design, not as a workaround.

---

## 7. Phased Build Plan

### Phase 0 — Validate (Week 1)
- Study Presidio, Nightfall, Skyflow to know exactly what's already solved vs. what's genuinely missing at the SMB/freelancer tier.
- Talk to 3-5 people who'd actually use this (freelancers with NDAs, small agency owners, maybe your AVYSTRA client) — confirm the pain is real and they'd install a browser extension for it.
- Define the entity types for v1 (start narrow: emails, API keys, phone numbers, a custom glossary field — don't try to catch everything on day one).

### Phase 1 — Core Engine (Weeks 2–3)
- Build the detection + tokenization + rehydration pipeline as a **standalone TypeScript library**, decoupled from any UI.
- Test detection accuracy against a labeled sample set — track precision/recall, not just "it works on my examples."
- This library is the reusable IP — everything else is a wrapper around it.

### Phase 2 — Developer SDK (Weeks 4–5)
- Node.js and Python packages that wrap any LLM API call (`aegis.wrap(openai.chat.completions.create)` style) with the same detection + tokenization + audit pipeline.
- This is where your BYOK/multi-provider routing knowledge from the loop-engineering work becomes directly reusable.
- **Ship this before the extension.** It's the real, definable, budget-holding customer, and it avoids the DOM-scraping and browser-trust problems entirely.

### 🚦 Checkpoint — Kill Criteria Before Phase 3
Before building anything further, confirm:
- At least 3 real developers would actually add this SDK to a project (not "sounds cool," an actual "yes I'd install this")
- Detection precision/recall on your labeled test set is high enough on structured PII (aim for something you can honestly state a number on, not "it mostly works")
- If either fails, stop and fix the engine/positioning before adding more surfaces — don't build the dashboard on a shaky core.

### Phase 3 — Audit Log + Team Dashboard (Weeks 6–8)
- Local/server-side dashboard showing redaction history, entity types caught, exportable compliance report.
- Implement the hash-chain for tamper-evidence.
- Multi-seat policy management for small teams — **this is the actual monetizable layer.**

### Phase 4 — Browser Extension (Weeks 9–10)
- Manifest V3 extension targeting ChatGPT, Claude, and Gemini web UIs, built on the same engine.
- Position it explicitly as a free, open-source trust/distribution play — not a revenue driver.
- Show the user exactly what's about to be redacted before sending (transparency is the actual product here, not just the redaction).

### Phase 5 — Launch (Week 11+)
- Open-source the core engine + extension on GitHub (adoption + credibility + portfolio signal).
- Post the SDK on Product Hunt / dev communities / LinkedIn, targeted at developers shipping AI features, not general consumers.
- Paid team tier priced for Indian SMBs first (₹499–999/mo range), sold to the developers/teams who already adopted the free SDK — warm audience, not cold outreach.

---

## 8. Monetization Model (open-core, SDK-led)

- **Free forever:** core detection engine + SDK (open-source on GitHub) + browser extension — this is the trust/distribution layer, and it needs to stay free because the entire pitch is "verify it yourself," which is hard to say convincingly about a paywalled product
- **Paid team tier:** audit dashboard, compliance exports, multi-seat policy management, usage-based pricing for high-volume API wrapping — sold to teams who already adopted the free SDK, not cold outreach
- **Realistic revenue expectation:** treat this as a slow-burn credibility asset for the first several months. If it converts a handful of small teams to a paid tier in year one, that's a genuine win — not a guaranteed outcome, and the plan doesn't depend on it to be worth building.
- **Future, if traction is real:** white-label/licensing to agencies offering this as a value-add to their own clients

Open-core is deliberate: the free layer builds trust and distribution (which this category desperately needs, given the whole premise is "don't trust vendor promises"), the paid layer monetizes the organizations who actually need compliance proof — but be honest with yourself that this is the slower, harder-earned kind of revenue, not a fast side-hustle payout.

---

## 9. Why This Is Genuinely Portfolio-Worthy

This isn't "another AI wrapper" — walk an interviewer through:
- A real, cited, current market problem (not a hypothetical)
- A security-first architecture: local-only processing, encrypted vaults, tamper-evident hash-chained logs
- A provider-agnostic design (works with any LLM, not locked to one vendor)
- An open-core go-to-market strategy with a real monetization path
- Zero infrastructure cost until it has paying users — a sign of real engineering judgment, not just feature-building

This is the kind of story that separates "built a CRUD app with AI features" from "understood a systemic trust problem in the AI industry and engineered a real solution to it."

---

## 10. Risks & Honest Mitigations

| Risk | Mitigation |
|---|---|
| False negatives (missed sensitive data) are dangerous | Default to conservative/aggressive redaction; let users loosen it, never start loose |
| On-device NER model too weak vs. cloud-grade detection | Layer regex (near-perfect precision for structured data) under the NER model (catches unstructured/contextual data) so weak spots overlap |
| Browser extension store review/approval delays | Start development early, submit for review well before any launch date |
| Established DLP vendors (Nightfall, Skyflow) compete | They target enterprise budgets; you target the completely unserved SMB/freelancer tier — different customer, not a head-on fight |
| "Local-only" claim needs to be literally true | No shortcuts — if the architecture ever routes plaintext through a server "just for now," the entire trust pitch collapses |

---

## 11. Immediate Next Steps (this week)

1. Pick the 4-5 entity types for v1 (don't boil the ocean)
2. Set up the TypeScript library skeleton for the core engine
3. Find/label a small test dataset for detection accuracy
4. Talk to 2-3 real potential users before writing more code than necessary
