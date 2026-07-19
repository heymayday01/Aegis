# Security Policy

## Supported Versions

Aegis is currently in beta (`0.x.x`). Security fixes are applied to the latest `main` branch.

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | ✅ (latest main)   |
| < 0.1   | ❌                 |

## Reporting a Vulnerability

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please report vulnerabilities privately:

1. **Email**: Open a private security advisory on GitHub (Repository → Security → Advisories → New advisory)
2. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

You will receive a response within **48 hours**. We will coordinate disclosure and credit.

## Security Model

### What Aegis does

- **Detects and redacts PII** before it leaves the user's device
- **Writes a tamper-evident audit log** (SHA-256 hash chain) of every redaction event
- **Never stores plaintext vault data server-side** — the token↔value map is in-memory per request in this demo; in production it lives client-side or within the customer's infrastructure only

### What Aegis does NOT do

- **Does not encrypt data in transit** — that's the AI provider's responsibility (HTTPS)
- **Does not catch all PII** — see the "Honest limits" section in the README. Structured data (emails, keys, cards, Aadhaar, PAN, IPs) is caught reliably; unstructured business context is not
- **Does not replace a DLP** — it's a developer tool, not an enterprise data loss prevention system

### Threat model

| Threat | Mitigation |
|--------|-----------|
| PII leaked to AI provider | Redacted before the request leaves the device |
| Audit log tampering | SHA-256 hash chain — any edit breaks all downstream hashes |
| Token vault compromise | Vault is in-memory per request (demo) / client-side (production) — never server-persisted |
| Replay attacks | Tokens are per-session, not deterministic across calls |

## Disclosure Timeline

- **Day 0**: Report received, acknowledged within 48h
- **Day 1-7**: Triage + fix development
- **Day 7-14**: Fix released, public disclosure with credit
