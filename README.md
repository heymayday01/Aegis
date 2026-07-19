# Aegis — Verify, don't trust.

> A local-first redaction layer for AI. Strip PII before it leaves your device. Tamper-evident audit chain. Streaming-aware. $0 infra.

![Aegis](https://img.shields.io/badge/Aegis-v0.1.0-5eead4?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-000?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=for-the-badge&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-5eead4?style=for-the-badge)

---

## What is Aegis?

Aegis sits between you and any AI provider — OpenAI, Anthropic, Gemini, or your own. It strips emails, API keys, credit cards, Aadhaar, PAN, IPs, and your custom glossary terms **before** they leave the device, swaps them for reversible tokens, and writes a SHA-256 hash-chained audit log you can verify yourself.

No black-box DLP. No trust required.

## ✨ Features

### Core engine (`src/lib/aegis/`)
- **8 entity types** with real validators: Luhn for credit cards, Verhoeff for Aadhaar, vendor-specific patterns for API keys (AWS, Google, Stripe, GitHub, Slack, OpenAI)
- **Reversible tokenization** — `john@acme.com` → `[AEGIS:EMAIL:A1B2]`, with a provable round-trip invariant (`rehydrate(redact(x)) === x`)
- **Tamper-evident hash chain** — SHA-256 chained audit log, re-verified on every read. Tamper any entry and the chain breaks downstream.
- **Streaming-aware redaction** — a buffered sliding-window redactor that catches PII split across LLM stream chunk boundaries
- **Policy engine** — paranoid / balanced / permissive strictness, per-entity toggles, custom glossary

### Surfaces
- **Live Playground** — paste text, watch PII get highlighted + tokenized, rehydrate to verify the round-trip
- **Streaming Demo** — watch a simulated LLM stream arrive token-by-token with PII redacted live (with a visible buffering indicator)
- **Audit Log Explorer** — the tamper-evidence demo: click "Tamper this" on any entry, watch the chain break, click "Repair" to restore
- **Policy Editor** — change strictness, toggle entity types, manage glossary terms (changes apply live)
- **Architecture** — the system diagram, honest limits, and portfolio narrative

### Design
- **Liquid glass** UI — real SVG-displacement refraction on signature elements, frosted-glass material throughout
- **Scroll-reactive ambient background** — drifting radial orbs with scroll parallax
- **WebGL dot-matrix** hero background — flowing Perlin-noise dots in the Aegis palette
- **Curved draggable marquee** — SVG-path text that scrolls + can be flung with pointer drag
- **3D scroll cards** — sections that react as they enter/leave the viewport
- **Lenis smooth scroll** — buttery, premium feel
- **Fully responsive** + `prefers-reduced-motion` support

## 🚀 Quick start

```bash
# Install
bun install

# Set up the database
bun run db:push

# Start the dev server
bun run dev
```

Open `http://localhost:3000`.

## 🛠 Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | Prisma + SQLite |
| Motion | Framer Motion + Lenis |
| WebGL | ogl (dot-matrix background) |
| Glass | Custom SVG displacement-map refraction |
| Icons | lucide-react |

## 📁 Architecture

```
src/
├─ app/
│  ├─ layout.tsx              ← 3-font system, smooth scroll, ambient bg
│  ├─ page.tsx                ← single-page app (all sections)
│  ├─ globals.css             ← liquid glass system, design tokens
│  └─ api/
│     ├─ detect/route.ts      ← POST text+policy → detections
│     ├─ redact/route.ts      ← POST text+policy → redactedText + tokenMap
│     ├─ rehydrate/route.ts   ← POST redactedText + tokenMap → original
│     ├─ audit/route.ts       ← GET chain, POST seed/tamper/repair/clear
│     ├─ policy/route.ts      ← GET/POST policy + glossary
│     └─ stream/route.ts      ← GET → SSE streaming redaction demo
├─ lib/
│  ├─ aegis/                  ← the core engine (detection, tokenization, audit, streaming)
│  │  ├─ types.ts             ← EntityType, DetectionResult, Policy, AuditLogEntry
│  │  ├─ patterns/            ← regex bank (email, apiKey, phone, card, aadhaar, pan, ip)
│  │  ├─ detect.ts            ← detect(text, policy) → DetectionResult[]
│  │  ├─ tokenize.ts          ← redact() + rehydrate(), round-trip safe
│  │  ├─ audit.ts             ← SHA-256 hash-chained log, tamper detection
│  │  ├─ streaming.ts         ← buffered sliding-window streaming redactor
│  │  └─ policy-store.ts      ← policy persistence
│  ├─ liquid-glass.ts         ← SVG displacement-map refraction module
│  └─ db.ts                   ← Prisma client
└─ components/
   ├─ aegis/                  ← UI sections (hero, playground, streaming, audit, policy, architecture, nav, footer)
   └─ ui/                     ← shadcn/ui components
```

## 🔒 Security model

- **Raw sensitive data never leaves the user's device unredacted.** Detection, tokenization, and rehydration all happen server-side in this demo, but the architecture is designed for client-side / in-customer-infra execution.
- **No plaintext vault data is stored server-side.** The token↔value map is in-memory per request only. In production, it lives client-side (extension) or within the customer's own infrastructure (SDK).
- **Every redaction event is logged** in the tamper-evident hash chain. No silent redactions.
- **Only entity TYPES and COUNTS are stored** in the audit log — never the redacted values themselves.

## 📝 Honest limits

**Can catch reliably:**
- Emails, API keys (known formats), phone numbers, credit cards (Luhn-validated), Aadhaar (Verhoeff-validated), PAN, IP addresses, custom glossary terms

**Cannot reliably catch:**
- Proprietary business context ("the Acme acquisition terms")
- Indirect identifiers ("Bangalore + fintech + Series B")
- PII in images/audio/PDFs (multimodal — future work)
- PII in RAG-retrieved context that never passes through user input

**The honest v1 claim:** "Prevents accidental credential/PII leakage with a verifiable, local-first, provider-agnostic audit trail." Not "protects all your business secrets."

## 🎯 Portfolio rationale

This is a portfolio piece demonstrating:
- **Security-first thinking** — hash-chained tamper-evident logs, local-only processing
- **Architectural judgment** — MCP over DOM scraping, Presidio reuse over reinvention, shared core across surfaces
- **Modernity** — streaming-aware redaction, MCP protocol awareness, 2025-relevant LLM feature handling
- **Engineering maturity** — CI-gated accuracy, round-trip invariants, documented security disclosure path
- **Premium UI/UX** — liquid glass, scroll-reactive backgrounds, 3D motion, buttery smooth scroll

## 📄 License

MIT
