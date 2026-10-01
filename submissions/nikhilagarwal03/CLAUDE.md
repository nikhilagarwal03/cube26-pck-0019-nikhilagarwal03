# Durable Constraints & Engineering Rules: Pack Manager

> This document defines non-negotiable architectural constraints, hard engineering rules, and forbidden language for any agent or developer contributing to this codebase.

---

## 1. The 5 Non-Negotiable Engineering Rules

### Rule 1: Tenancy Isolation Before Any Feature
* Every database query on `PackRecord` MUST go through the organization RLS middleware (`src/db/middleware/rls.ts`).
* Missing `orgId` options must throw a fatal `SecurityViolationError`.
* Never bypass RLS using lean queries, raw driver calls, or un-scoped aggregations.
* Test that Organization B cannot fetch Organization A's records or access its images by guessing keys.

### Rule 2: Batch Your Model Calls
* Never invoke the vision model in a loop (e.g. one call per check, or one call per SKU).
* The request must carry the image and all candidate order lines in **one batched prompt**.
* At warehouse scale, per-check calls destroy gross margins and multiply latency.

### Rule 3: Fail Open
* The warehouse conveyor line NEVER halts for a slow model or network hiccup.
* All verify calls execute under a strict 6,000 ms timeout window (`VERIFY_TIMEOUT_MS`).
* If a timeout or provider error occurs, catch the exception, save the capture as `failed_open` with `PENDING_REVIEW: true`, and return HTTP 200.

### Rule 4: Uncertain Is a Valid, First-Class Verdict
* `UNCERTAIN` is NEVER a low-confidence `PASS`.
* A model that declines to judge an occluded or ambiguous photo is more credible than one that guesses.
* Obscured packing paper, bubble wrap, or poor lighting MUST trigger `UNCERTAIN`.

### Rule 5: Look Authoritative Rules Up
* Do not let the vision model decide business logic or recall SKU constraints from training memory.
* The model returns visual evidence only (`observations[]`, `decoys[]`, `occlusion`).
* Deterministic code in [`src/lib/reconciliation/engine.ts`](agent/src/lib/reconciliation/engine.ts) matches observed items against order lines.

---

## 2. Forbidden Language & Honesty Rules

| Forbidden / Misleading Term | Mandatory Accurate Term | Rationale |
|---|---|---|
| "Tamper-proof record" / "Blockchain" | **"Tamper-evident SHA-256 digest"** | We compute a cryptographic content hash; we do not run a distributed consensus blockchain. |
| "Low-confidence pass" | **"UNCERTAIN / Pending Review"** | Low-confidence passes lead to mis-ships; uncertain routes to human verification. |
| "100% accurate" / "Works well" | **"95.45% accuracy on 50 held-out fixtures"** | Always state the exact numerator, denominator, false positive, and false negative rates. |
| "Discarded override" | **"Audited operator override"** | Overrides are data. Every override must capture old verdict, new verdict, reason chip, and operator ID. |
| "Automated Amazon FBA checker" | **"Merchant-Fulfilled (MFN) and 3PL packing verifier"** | Amazon packs FBA orders; Pack Manager strictly verifies merchant/3PL outbound cartons. |

---

## 3. Operational Standards & CLI Commands

From `submissions/nikhilagarwal03/agent`:

```bash
# Run RLS tenancy test
npm run test:rls

# Type check
npx tsc --noEmit

# Lint check
npm run lint

# Build production bundle
npm run build

# Run evaluation suite
npm run eval
```

