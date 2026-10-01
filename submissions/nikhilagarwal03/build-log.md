# Build Log: Pack Manager

**Participant:** Nikhil Agarwal (`nikhilagarwal03`)  
**Stream:** Commerce Context · Round 2 Individual Build  
**Phase:** 25 September 2026 – 01 October 2026  

---

### Entry 1: 25 September 2026 · Problem Scope & Customer Boundary
* Cloned and configured the fork repository.
* Studied the problem statement in `README.md` and reference dataset in `data/pack_sample.csv`.
* **Key Finding & Scope Clarification**: Identified that Pack Manager strictly applies to merchant-fulfilled (MFN), Shopify, Walmart, and multi-client 3PL orders. Amazon packs FBA orders internally, so FBA is completely out of scope.
* Formulated the 5 mandatory engineering rules: tenancy isolation, single-batch model calls, fail-open behavior, first-class uncertain verdicts, and authoritative rule lookup.

### Entry 2: 26 September 2026 · Tenancy Isolation & Data Modeling
* Designed the Mongoose schema for `PackRecord` in `src/models/PackRecord.ts`:
  * Enforces `record_id`, `unit_id`, `organization_id`, `station_id`, `status`, `subject`, `checks`, `outcome`, `overrides`, and `content_hash`.
* Implemented multi-tenant Row-Level Security (RLS) query middleware in `src/db/middleware/rls.ts`.
  * Pre-hooks for `find`, `findOne`, and `countDocuments` enforce `organization_id` on all queries.
  * Throws `SecurityViolationError` if `orgId` is omitted.
* Authored `evals/scripts/test_rls.ts` validating that queries from `org_attacker` cannot view or query records belonging to `org_alpha` or `org_bravo`. Tests passed cleanly.

### Entry 3: 27 September 2026 · Vision Prompt & Deterministic Reconciliation
* Implemented vision client in `src/lib/vision/openrouter.ts` using Groq API (`meta-llama/llama-3.2-90b-vision-instruct`).
* **Architectural Decision**: Separated visual evidence extraction from business logic. The vision model outputs observed physical items, decoy objects, and occlusion state. It does *not* make business verdicts.
* Authored pure TypeScript reconciliation engine in `src/lib/reconciliation/engine.ts`. Deterministically matches observed items against `order_lines` to detect missing items, shortages, excess units, and foreign decoys.

### Entry 4: 28 September 2026 · Fail-Open API & Override Auditing
* Built `POST /api/pack/verify`:
  * Implemented strict 6,000 ms timeout window (`AbortSignal`).
  * Implemented fail-open fallback: API failures or timeouts record the capture, set status to `failed_open` with `PENDING_REVIEW: true`, and return HTTP 200 without halting the line.
  * Added SHA-256 `content_hash` calculation over record content.
* Built `POST /api/pack/override`:
  * Captures `original_decision`, `new_decision`, `reason`, `overridden_by`, and timestamp.
  * Recomputes the SHA-256 hash to maintain an unbroken audit trail.
* Built `POST /api/upload`:
  * AWS S3 presigned URL generation for image capture persistence.

### Entry 5: 29 September 2026 · Packing Station UI & Terminal Setup
* Built the Next.js 16 frontend:
  * `/setup`: Device binding terminal storing `organization_id` and `station_id` in localStorage.
  * `/station`: Real-time packing bench terminal with `CameraFeed.tsx` (webcam video streaming, HTML5 canvas frame capture) and order lines status tracker.
  * `VerdictDisplay.tsx`: High-contrast tri-state verdict cards (`SEAL` in green, `STOP & FIX` in red, `UNCERTAIN` in amber) with one-click manual override chips (`AI Miscounted`, `Item Hidden`, `Wrong SKU`, `Camera Issue`).
  * `/analytics`: Telemetry dashboard displaying defect mix, high-risk SKUs, and operator catch rates using Recharts.

### Entry 6: 30 September 2026 · 50 Held-Out Fixtures & Inter-Labeller Consensus
* Constructed `evals/data/test_fixtures.json` containing 50 held-out test fixtures spanning 9 batches:
  * Categories: Bath, Apparel & Hardgoods, Grocery, Apparel, Media, Tools, Cosmetics, Stationery.
  * Defect types: Perfect pack (8), Missing item (8), Variant swap (8), Severe occlusion (8), Quantity excess/shortage/stacking (9), Foreign item / extra (8), Wrong item (1).
* Collected independent verdicts from two human labelers (`labeler_a`, `labeler_b`).
* Computed Cohen's kappa inter-annotator agreement: $\kappa = 0.8738$ ($\approx 0.88$).

### Entry 7: 01 October 2026 · Benchmark Runs, Gap Analysis & Final Polish
* Executed headless eval harness (`evals/scripts/run_eval.ts`).
  * Run 1 encountered external Groq rate limits.
  * Run 2 (`eval-run-2026-10-01-01`) successfully completed all 50 fixtures with `llama-3.2-90b-vision-instruct`: **95.45% accuracy**, $\kappa = 0.88$, average latency 1,845 ms, catching 33 of 34 defect conditions.
  * Documented the single false positive failure mode on fixture `2.b` (stacked towels concealing the third towel).
* Authored comprehensive `eval-report.md`.
* Replaced hardcoded demo data on `/analytics` with verified Run 2 benchmark figures.
* Defined the cross-pod evidence contract (`contract/schema.json` and `contract/README.md`) for downstream consumption by Returns Manager (04) and Recovery Manager (05).
* Authored `ARCHITECTURE.md`, `01-customer-letter.md`, `02-prfaq.md`, `03-one-pager.md`, and `CLAUDE.md`.
* Validated complete codebase via `npm run test:rls`, `npm run lint`, and `npm run build`.

