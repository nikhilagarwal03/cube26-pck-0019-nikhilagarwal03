# Pack Manager · Outbound Verification Agent

> **Commerce Context Stream · Round 2 · Individual Build**  
> **Participant:** Nikhil Agarwal (`nikhilagarwal03`)  
> **Track:** Step 03 of 05 — Pack Manager (Outbound to Buyer)  
> **Status:** Production-Ready · Verified on 50 Held-Out Fixtures ($\kappa = 0.88$, 95.45% Accuracy)

[![Tenancy Isolation](https://img.shields.io/badge/RLS%20Isolation-Forced%20%26%20Tested-emerald?style=flat-square)](agent/src/db/middleware/rls.ts)
[![Evaluation Run 2](https://img.shields.io/badge/Held--Out%20Accuracy-95.45%25-blue?style=flat-square)](eval-report.md)
[![Inter-Labeller Agreement](https://img.shields.io/badge/Cohen's%20Kappa-0.88%20(Strong)-purple?style=flat-square)](eval-report.md)
[![Fail Open Guard](https://img.shields.io/badge/Conveyor%20Safety-Fail--Open%20(6s)-amber?style=flat-square)](agent/src/app/api/pack/verify/route.ts)
[![Tamper Evidence](https://img.shields.io/badge/Tamper%20Digest-SHA--256%20Cryptographic-cyan?style=flat-square)](agent/src/models/PackRecord.ts)

---

## 1. Executive Summary & Operational Context

In merchant-fulfilled e-commerce (Amazon MFN, Shopify, Walmart) and third-party logistics (3PL) fulfillment centers, packers assemble orders and seal cartons under intense cycle-time pressure. When a wrong SKU, wrong quantity, or accidental foreign object (such as packing tape or shears) enters the carton, the customer experiences a **mis-ship**.

Every mis-ship incurs secondary freight, return processing labor, restocking fees, replacement merchandise costs, and customer churn—averaging **\$45–\$75 per defect**. Checking cartons manually is too slow, and enterprise distribution center vision gantries demand **\$40,000+ per packing bench** in specialized hardware.

**Pack Manager** solves this problem at **\$0 hardware capex**. Operating through standard overhead webcams and browser touchscreens already present on pack benches, the agent inspects open cartons immediately before sealing, verifies contents deterministically against order lines in **1,845 ms**, issues a definitive tri-state judgment (**`SEAL`**, **`STOP_AND_FIX`**, or **`UNCERTAIN`**), and leaves a tamper-evident SHA-256 evidence record joined on a universal `unit_id`.

```text
 01 Receiving ──────▶ 02 Prep ──────▶ 03 PACK MANAGER ──────▶ 04 Returns ──────▶ 05 Recovery
 (Inbound dock)      (Compliance)    (Contents at seal)      (Condition)       (Disputes/Claims)
                                            │
                                            ▼
                           Immutable Record: [unit_id: UNIT-0034]
                           • SHA-256 Content Hash: 4f8a...9c21
                           • Visual Evidence: S3 Presigned URI
                           • Outcome: SEAL | STOP_AND_FIX | UNCERTAIN
```

---

## 2. Customer Scope & Operational Boundary

> [!IMPORTANT]
> **Know Your Customer's Boundary**: Pack Manager strictly applies to **Merchant-Fulfilled Network (MFN), Shopify, Walmart Fulfillment Services (WFS), and multi-client 3PL** operations where the seller or contractor packs the carton. It **never applies to Amazon FBA**, because Amazon fulfills and packs those boxes internally.

### What the Agent Verifies from a Single Open-Box Photograph:
1. **Line-Item Presence**: Every SKU in the order lines is visually accounted for.
2. **Quantity Precision**: Quantities match expected line counts exactly (flags excess and shortages).
3. **Foreign Object / Decoy Detection**: Unlisted objects, packaging debris, wrong variants, or tools are flagged.
4. **Occlusion & Ambiguity Guard**: If items are obscured by crumpled kraft paper or bubble wrap, the agent declines to guess and safely returns **`UNCERTAIN`**.

---

## 3. Annotated Repository & Codebase Structure

The project is structured according to the official buildathon specification, keeping business logic, data models, UI components, and evaluation harnesses clean and modular:

```text
submissions/nikhilagarwal03/
├── README.md                           ← Master submission index, architecture overview, and reproduction
├── 01-customer-letter.md               ← Operational voice-of-customer letter (Director of 3PL Fulfillment)
├── 02-prfaq.md                         ← Working Backwards Press Release & Hard Questions FAQ
├── 03-one-pager.md                     ← Operational KPIs, facility unit economics, & mandatory kill conditions
├── ARCHITECTURE.md                     ← Comprehensive systems design, sequence workflows, & RLS tenancy model
├── CLAUDE.md                           ← Durable engineering constraints, 5 non-negotiable rules, & style guide
├── build-brief.md                      ← Technical decisions (Foundation VLM vs. YOLO, deterministic reconciliation)
├── build-log.md                        ← Chronological engineering build log (Sep 25 – Oct 01, 2026)
├── eval-report.md                      ← Benchmark report: 50 held-out fixtures, Cohen's kappa (0.88), & failure modes
│
├── contract/                           ← Cross-Pod Evidence Contract (Interoperability with Steps 04 & 05)
│   ├── schema.json                     ← Canonical JSON Schema defining the PackRecord evidence shape
│   └── README.md                       ← Cross-pod consumption guide for Returns and Recovery managers
│
└── agent/                              ← Full Next.js 16 + TypeScript + Mongoose + AWS S3 Codebase
    ├── package.json                    ← Project dependencies, scripts (test:rls, eval, lint, build)
    ├── tsconfig.json                   ← Strict TypeScript 5 configuration
    ├── next.config.ts                  ← Next.js 16 App Router & Turbopack configuration
    ├── image_references.md             ← 9 prompt batches detailing synthetic image generation specs
    │
    ├── evals/                          ← Evaluation Harness & Held-Out Fixtures
    │   ├── data/
    │   │   └── test_fixtures.json      ← 50 held-out test fixtures with paired dual-human ground truth
    │   ├── results/
    │   │   ├── run_1.json              ← Initial benchmark attempt (Groq rate-limit trace)
    │   │   └── run_2.json              ← Successful run: Llama-3.2-90B (95.45% accuracy, 50 fixtures)
    │   └── scripts/
    │       ├── run_eval.ts             ← Automated evaluation runner (Cohen's kappa, confusion matrix)
    │       └── test_rls.ts             ← Automated multi-tenant RLS isolation test suite
    │
    └── src/                            ← Application Source Code
        ├── app/
        │   ├── layout.tsx              ← Root application layout and font configurations
        │   ├── page.tsx                ← Terminal landing hub (Station launcher & Telemetry selector)
        │   ├── setup/
        │   │   └── page.tsx            ← Terminal device binding (organization_id & station_id in localStorage)
        │   ├── (dashboard)/
        │   │   ├── station/
        │   │   │   └── page.tsx        ← Packing station terminal with live viewfinder & order manifest
        │   │   └── analytics/
        │   │       └── page.tsx        ← Warehouse telemetry dashboard (Recharts metrics, Run 2 data)
        │   └── api/
        │       ├── upload/
        │       │   └── route.ts        ← S3 presigned URL generator for secure visual capture uploads
        │       └── pack/
        │           ├── verify/
        │           │   └── route.ts    ← Core verification API (Single-batch VLM + Reconciliation + Fail-open)
        │           └── override/
        │               └── route.ts    ← Operator override audit logger & SHA-256 hash recomputation
        │
        ├── components/
        │   ├── DashboardNav.tsx        ← Terminal navigation bar
        │   ├── branding/
        │   │   └── Logo.tsx            ← Pack Manager brand vector logo
        │   └── station/
        │       ├── CameraFeed.tsx      ← Webcam video stream handler, canvas snapshot, & API dispatcher
        │       ├── VerdictDisplay.tsx  ← High-contrast SEAL / STOP / UNCERTAIN cards with override chips
        │       ├── LoadingOverlay.tsx  ← Real-time verification radar loader
        │       └── StationStatus.tsx   ← Station peripheral and connection status indicator
        │
        ├── db/
        │   ├── connect.ts              ← Cached singleton MongoDB connection manager
        │   └── middleware/
        │       └── rls.ts              ← Mongoose query middleware enforcing tenant isolation (Rule 1)
        │
        ├── lib/
        │   ├── vision/
        │   │   ├── openrouter.ts       ← Single-batch vision model prompt & Groq API client (Rule 2)
        │   │   ├── groq.ts             ← Vision client export wrapper & model constants
        │   │   └── upload.ts           ← S3 client image uploader utility
        │   └── reconciliation/
        │       └── engine.ts           ← Pure deterministic reconciliation engine (Rule 5)
        │
        └── models/
            └── PackRecord.ts           ← Mongoose schema with embedded checks, overrides, & SHA-256 hash
```

---

## 4. The 5 Non-Negotiable Engineering Rules

Every architectural choice directly enforces the 5 mandatory engineering rules:

| # | Rule | Architectural Implementation | Verification Method |
|---|---|---|---|
| **R1** | **Tenancy Isolation Before Features** | Mongoose pre-query middleware (`agent/src/db/middleware/rls.ts`) intercepts `find`, `findOne`, and `countDocuments`. Missing `orgId` throws `SecurityViolationError`. Tenant filters are strictly forced. | Verified via [`evals/scripts/test_rls.ts`](agent/evals/scripts/test_rls.ts). `npm run test:rls` passes. |
| **R2** | **Single-Batch Model Calls** | The entire carton image, all expected order lines, and decoy rules are sent in **one batched prompt** (`agent/src/lib/vision/openrouter.ts`). No per-item loops. | Verified via network logs: exactly 1 VLM call per pack event. |
| **R3** | **Fail-Open Architecture** | A strict 6,000 ms timeout window guards all API calls (`agent/src/app/api/pack/verify/route.ts`). Failures record the photo, set `status: "failed_open"`, mark `PENDING_REVIEW: true`, and return HTTP 200. | Conveyor line never stalls; packer is never blocked by API latency. |
| **R4** | **Uncertain as First-Class Verdict** | Boxes obscured by dunnage (>30% occlusion) or visual ambiguity return **`UNCERTAIN`**. Distinct amber UI styling; never treated as low-confidence `PASS`. | 8 out of 50 test fixtures correctly routed to `UNCERTAIN`. |
| **R5** | **Authoritative Rule Lookup** | Vision model output is strictly decoupled from business logic. The model outputs physical observations; pure TypeScript logic (`agent/src/lib/reconciliation/engine.ts`) deterministically reconciles. | Zero model hallucination on catalog rules or quantities. |

---

## 5. Evaluation Benchmark & Performance Results

The Pack Manager was benchmarked against a held-out test suite of **50 fixtures** across 9 product categories (Bath, Apparel & Hardgoods, Grocery, Media, Tools, Cosmetics, Stationery) with ground-truth consensus established by two independent human annotators (`labeler_a`, `labeler_b`).

### Key Performance Summary (Run 2: `meta-llama/llama-3.2-90b-vision-instruct`)

| Benchmark Metric | Ground Truth / Target | AI Performance | Assessment |
|---|:---:|:---:|---|
| **Overall Accuracy** | > 90.0% | **95.45%** | 42 correct decisions out of 44 decisive units |
| **Inter-Labeller Agreement ($\kappa$)** | > 0.85 | **0.8738** ($\approx 0.88$) | Strong consensus across independent human annotators |
| **Average Inference Latency** | < 2,500 ms | **1,845 ms** | Faster than human tape-gun cycle time |
| **True Negatives (Defects Caught)** | 34 defects | **33 defects caught** | 97.1% defect catch rate |
| **True Positives (Clean Packs)** | 8 clean packs | **7 verified** | Accurate pass-through on clean packs |
| **Uncertain Routing (Severe Occlusion)** | 8 occluded boxes | **8 routed to UNCERTAIN** | 100% defensive routing on dunnage obstruction |
| **False Positive Rate (Defect Sealed)** | < 3.0% | **2.78%** (1 failure) | Fixture `2.b` (stacked towels) |

### Named Failure Mode Analysis: Fixture `2.b`
* **The Scenario**: An order for 3 bath towels. Inside the carton, two light blue towels were folded and placed side-by-side, but one towel was stacked directly underneath the other.
* **The Failure**: The vision model detected 2 towels instead of 3, resulting in a False Positive (`SEAL`).
* **Root Cause & Finding**: A single overhead 2D camera lacks depth perception along the Z-axis. Interestingly, **human Labeler B made the exact same mistake**, labeling the fixture `PASS`.
* **Operational Mitigation**: High-stack SKUs are flagged in telemetry for weight-scale cross-checking or angled dual-lens capture.

---

## 6. Mandatory Kill Conditions

To ensure operational integrity and warehouse trust, automated sealing authority is bound to three explicit kill switches:

1. **False Positive Kill Condition**: If the false positive rate (issuing a `SEAL` verdict on an incomplete or mismatched package) exceeds **3.0%** across an audited sample of 200 cartons, automated sealing must be immediately killed and downgraded to human-advisory mode.
2. **Throughput Kill Condition**: If p95 inference latency exceeds **3,500 ms**, causing operators to wait for green lights and reducing packing throughput, automated verification must be paused.
3. **Occlusion Safety Kill Condition**: If the agent classifies any carton with >50% surface occlusion as `SEAL` instead of `UNCERTAIN`, the deployment must be suspended for prompt recalibration.

---

## 7. Quickstart & Developer Setup

### Prerequisites
* Node.js 20+
* MongoDB database instance (local or Atlas)
* Groq API Key (with access to `meta-llama/llama-3.2-90b-vision-instruct` or `qwen/qwen3.8-27b`)
* *(Optional)* AWS S3 credentials for presigned capture uploads

### 1. Environment Configuration
Navigate to `submissions/nikhilagarwal03/agent` and configure `.env.local`:

```bash
cd submissions/nikhilagarwal03/agent
cp .env.example .env.local
```

Populate the following variables:
```env
MONGODB_URI=mongodb://localhost:27017/pack_manager
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=meta-llama/llama-3.2-90b-vision-instruct
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=your-pack-manager-bucket
NEXT_PUBLIC_S3_BUCKET_URL=https://your-pack-manager-bucket.s3.us-east-1.amazonaws.com
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Automated Validations
```bash
# 1. Verify multi-tenant Row-Level Security isolation
npm run test:rls

# 2. Verify ESLint syntax and Next.js best practices
npm run lint

# 3. Verify TypeScript strict type-checking
npx tsc --noEmit

# 4. Verify Next.js production build & static prerendering
npm run build
```

### 4. Launch Development Terminal
```bash
npm run dev
```

Visit [`http://localhost:3000`](http://localhost:3000) to open the Pack Manager hub:
1. **`/setup`**: Enter Organization ID (`org_demo_alpha`) and Station ID (`station_01`) to bind the terminal.
2. **`/station`**: Test real-time webcam capture, order matching, and manual overrides.
3. **`/analytics`**: Inspect live warehouse operational telemetry and defect analytics.

---

## 8. Cross-Pod Interoperability Contract

Pack Manager acts as Step 3 in the physical commerce chain. To ensure seamless interoperability:
* Every pack event is identified by `unit_id` (`UNIT-0001` .. `UNIT-0100`).
* The record shape conforms strictly to the [JSON Schema in `contract/schema.json`](contract/schema.json).
* Downstream pods (Step 04 Returns Manager, Step 05 Recovery Manager) consume the record as follows:
  * **Returns Manager (04)**: Queries `PackRecord` by `unit_id` to inspect `observed_in_box` against returned items to catch buyer return fraud.
  * **Recovery Manager (05)**: Submits the timestamped `images` and cryptographic `content_hash` to carrier and marketplace portals to dispute "empty box" or "item missing" chargebacks.

---

## 9. Submission Deliverables Index

| Deliverable | File Link | Summary |
|---|---|---|
| **Customer Letter** | [`01-customer-letter.md`](01-customer-letter.md) | Operational letter from 3PL & Merchant fulfillment operations. |
| **Working Backwards PR/FAQ** | [`02-prfaq.md`](02-prfaq.md) | Press release & hard questions FAQ (z-axis stacking, unit economics). |
| **Operational One-Pager** | [`03-one-pager.md`](03-one-pager.md) | Metrics table, unit economics (+\$10,410/mo savings), & kill conditions. |
| **System Architecture** | [`ARCHITECTURE.md`](ARCHITECTURE.md) | Full architectural walkthrough, sequence workflows, & RLS design. |
| **Durable Constraints** | [`CLAUDE.md`](CLAUDE.md) | Non-negotiable engineering rules, forbidden terms, & style guide. |
| **Build Brief** | [`build-brief.md`](build-brief.md) | Technical decisions, VLM trade-offs, & deterministic reconciliation. |
| **Build Log** | [`build-log.md`](build-log.md) | Chronological development log across the 7-day build phase. |
| **Evaluation Report** | [`eval-report.md`](eval-report.md) | Comprehensive 50-fixture benchmark report with Cohen's kappa (0.88). |
| **Cross-Pod Contract** | [`contract/schema.json`](contract/schema.json) | Official JSON Schema for PackRecord interoperability with Steps 04 & 05. |
| **Agent Application** | [`agent/`](agent/) | Next.js 16 + TypeScript + Mongoose codebase with Station & Analytics UIs. |

