# Changelog

All notable changes to Aegis are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-07-19

### Added
- **Core engine** (`src/lib/aegis/`)
  - 8 entity types: EMAIL, API_KEY, PHONE, CREDIT_CARD, AADHAAR, PAN, IP_ADDRESS, CUSTOM_GLOSSARY
  - Real validators: Luhn (credit cards), Verhief (Aadhaar), vendor-specific API key patterns (AWS, Google, Stripe, GitHub, Slack, OpenAI)
  - Reversible tokenization with provable round-trip invariant
  - SHA-256 hash-chained tamper-evident audit log
  - Streaming-aware redaction with sliding-window buffer
  - Policy engine: paranoid/balanced/permissive strictness + per-entity toggles + custom glossary
- **API routes**
  - `POST /api/detect` — detect entities in text
  - `POST /api/redact` — redact + log to audit chain
  - `POST /api/rehydrate` — restore original from tokens
  - `GET /api/audit` — read the hash chain (re-verified on read)
  - `POST /api/audit` — seed/tamper/repair/clear the chain
  - `GET /api/policy` — read active policy + glossary
  - `POST /api/policy` — update policy + add/remove glossary terms
  - `GET /api/stream` — simulated SSE streaming redaction demo
  - `POST /api/stream-llm` — real LLM streaming with live redaction (z-ai-web-dev-sdk)
  - `GET /api/export` — compliance report export (CSV/JSON)
- **UI surfaces**
  - Live playground with highlighted detections + round-trip proof
  - Streaming demo with Demo + Live LLM modes, buffering indicator, terminal aesthetic
  - Audit log explorer with tamper/repair/clear/seed + CSV/JSON export
  - Policy editor with strictness radios + entity toggle grid + glossary manager
  - Architecture section with system diagram + honest limits + portfolio narrative
- **Design system**
  - Liquid glass material (`.glass` CSS class) with SVG displacement-map refraction on signature elements
  - Scroll-reactive ambient background (3 drifting radial orbs with scroll parallax)
  - WebGL dot-matrix hero background (Perlin noise, scroll-paused)
  - Curved draggable marquee (SVG path, pointer fling with inertia)
  - 3D scroll cards (opacity-linked reveal)
  - Lenis smooth scroll
  - Pill-shaped floating glass nav with hide-on-scroll + mobile expand animation
  - Instrument Serif + Geist + JetBrains Mono font system
- **Production features**
  - Global error boundary with recovery UI
  - 404 page
  - Loading skeleton state
  - `sitemap.xml` + `robots.txt` (Next.js metadata routes)
  - JSON-LD structured data (SoftwareApplication schema)
  - `.env.example` with documented variables
  - `SECURITY.md` vulnerability disclosure policy
  - `CONTRIBUTING.md` development setup + conventions

### Performance
- `content-visibility: auto` on all sections (skips offscreen rendering)
- Lazy liquid-glass init via IntersectionObserver (only 2 signature elements use SVG refraction)
- Opacity-only scroll-card transforms (was rotateY+scale+opacity)
- Ambient background: scroll parallax only (removed mouse-parallax springs)
- 72% reduction in GPU compositing layers vs initial implementation
- WebGL dot-matrix pauses when hero scrolls off-screen
- DPR capped at 2, 30fps render cap on WebGL

### Security
- No plaintext vault data stored server-side (in-memory per request)
- Audit log stores only entity TYPES + COUNTS, never values
- Tamper-evident hash chain re-verified on every read

## [Unreleased]

### Planned
- MCP server as a separate process
- npm package (`@aegis/core`) extraction
- Presidio backend adapter for names/orgs detection
- NextAuth.js multi-tenant dashboard
- CI accuracy regression test suite
