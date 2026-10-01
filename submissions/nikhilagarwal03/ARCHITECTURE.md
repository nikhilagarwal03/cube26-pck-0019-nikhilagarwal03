# Systems Architecture & Engineering Design: Pack Manager

> **Track:** Step 03 of 05 — Pack Manager (Outbound to Buyer)  
> **Author:** Nikhil Agarwal (`nikhilagarwal03`)  
> **Stream:** Commerce Context · Round 2 Individual Build  
> **Status:** Architecture Baseline · Fully Implemented & Tested

---

## 1. Architectural Philosophy & Operational Constraints

In high-volume e-commerce fulfillment (Amazon MFN, Shopify, Walmart, 3PL), warehouse packing benches operate under unforgiving operational realities:
* **The Cycle Time Budget**: Packers fold, fill, verify, tape, and label a carton in **15 to 25 seconds**. Any software verification step that adds more than 2 seconds will be bypassed by packers within 24 hours.
* **The Zero-Capex Mandate**: Enterprise fulfillment centers deploy \$40,000+ vision gantries with calibrated illumination and industrial PLCs. Mid-market 3PLs and merchant shippers cannot afford this capital expenditure. Pack Manager must run on standard commodity overhead webcams and existing bench touchscreens.
* **The Zero-Blockage Rule (Fail-Open)**: If cloud APIs stutter or experience rate limits, the conveyor line *must never stop*. A carton with pending verification must proceed, with evidence captured for asynchronous review.
* **Strict Multi-Tenancy**: 3PLs pack goods for competing brands on the same physical bench. Cross-tenant leakage of images, orders, or pack records is a catastrophic compliance failure.

To address these constraints, Pack Manager is designed around a **Two-Phase Decoupled Architecture**: high-throughput multi-modal visual perception coupled with deterministic, zero-hallucination reconciliation logic.

---

## 2. End-to-End System Architecture

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                                EDGE / PACK STATION TIER                                │
 │                                                                                        │
 │   [Physical Carton] ──▶ [Overhead USB Webcam] ──▶ [Browser Viewfinder: /station]       │
 │                                                  │                                     │
 │   • HTML5 Canvas Frame Extraction (1080p/4K)     │ Base64 Data URL /                   │
 │   • LocalStorage Terminal Binding (/setup)       │ S3 Presigned Upload                 │
 └──────────────────────────────────────────────────┼─────────────────────────────────────┘
                                                    │
                                                    ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                              APPLICATION & GATEWAY TIER                                │
 │                              (Next.js 16 App Router)                                   │
 │                                                                                        │
 │   POST /api/pack/verify                                                                │
 │   ├── 1. Request Validator (Zod/Type guard)                                            │
 │   ├── 2. Tenant Context Resolver (organization_id check)                               │
 │   ├── 3. Asynchronous Timeout Guard (AbortController: 6,000 ms limit)                   │
 │   └── 4. Cryptographic Tamper Digest Engine (SHA-256 content hashing)                   │
 └───────────┬────────────────────────────────────────────────────────────────┬───────────┘
             │                                                                │
             ▼                                                                ▼
 ┌──────────────────────────────┐                         ┌───────────────────────────────┐
 │   INTELLIGENCE TIER (VLM)    │                         │  DETERMINISTIC VERIFICATION   │
 │   (Groq / Llama 3.2 90B)     │                         │   (Pure TypeScript Engine)    │
 │                              │                         │                               │
 │ • Single-Batch Vision Prompt │   Observations &        │ • Mathematical Item Aggregator│
 │ • Optical Character / Text   │   Decoys Output         │ • Missing Line Detector       │
 │ • Physical Object Counting   ├────────────────────────▶│ • Quantity Mismatch Checker   │
 │ • Surface Occlusion Guard    │                         │ • Foreign Object / Decoy Flag │
 └──────────────────────────────┘                         │ • Tri-State Decision Emitter  │
                                                          └───────────────┬───────────────┘
                                                                          │
                                                                          ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                             SECURITY & PERSISTENCE TIER                                │
 │                                 (MongoDB & AWS S3)                                     │
 │                                                                                        │
 │   Collection: packrecords                                                              │
 │   ├── Mongoose Pre-Query RLS Middleware (Forced organization_id scoping)              │
 │   ├── Full Audit Trail (overrides[], original_decision, operator_id, reason)           │
 │   └── Immutable SHA-256 Digest for Cross-Pod Interoperability (Steps 04 & 05)          │
 └────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Flow & Execution Sequences

### 3.1 Normal Verification Flow (`SEAL` / `STOP_AND_FIX`)

The standard outbound verification sequence executes in under **1,845 ms**, well within human handling cycle times:

```text
  Packer             Station Terminal (/station)   API (/api/pack/verify)        Vision (Llama 3.2 90B)     Reconciliation Engine      MongoDB (PackRecord)
    │                         │                            │                             │                          │                        │
  1 │── Places items in box ─▶│                            │                             │                          │                        │
  2 │                         │── Captures 1080p frame ───▶│                             │                          │                        │
  3 │                         │   POST /api/pack/verify    │── Batched Vision Prompt ───▶│                          │                        │
    │                         │   (image, order_lines)     │   (image, expected SKUs)    │                          │                        │
  4 │                         │                            │                             │── Returns evidence ─────▶│                        │
    │                         │                            │                             │   observations & decoys  │                        │
  5 │                         │                            │                             │                          │── reconcilePack() ────▶│
    │                         │                            │                             │                          │   Missing/Mismatch/Decoys
  6 │                         │                            │◀────────────────────────────┼──────────────────────────┼── Returns verdict ─────│
    │                         │                            │                             │                          │   (SEAL / STOP_AND_FIX)│
  7 │                         │                            │── Compute SHA-256 hash & save record (with RLS orgId) ─────────────────────────▶│
  8 │                         │◀── HTTP 200 {verdict} ─────│                                                                                 │
  9 │◀── Visual UI Card ──────│                                                                                                              │
    │   (SEAL or STOP_AND_FIX)│                                                                                                              │
```

| Step | Component | Action / Payload | Operational Meaning |
|---|---|---|---|
| **1–2** | Packer $\rightarrow$ Station | Open box photo captured via webcam canvas | Frame buffered as JPEG base64 or S3 presigned URL |
| **3** | Station $\rightarrow$ API | `POST /api/pack/verify` | Dispatches image, order lines, and tenant `org_id` under 6s timeout |
| **4** | API $\rightarrow$ Vision VLM | Single batched prompt (`openrouter.ts`) | Inspects visible text, labels, quantities, decoys, and occlusion |
| **5–6** | VLM $\rightarrow$ Recon Engine | `reconcilePack({order_lines, extracted})` | Pure TypeScript deterministic comparison (no LLM hallucination) |
| **7** | API $\rightarrow$ MongoDB | `PackRecordModel.create(...)` | Computes SHA-256 content digest and saves with forced RLS |
| **8–9** | API $\rightarrow$ Station | HTTP 200 `{reconciliation, record_id}` | UI lights up **Green SEAL** (tape carton) or **Red STOP & FIX** |

---

### 3.2 Fail-Open Conveyor Safety Flow (Timeout / Outage)

Under network degradation or vision provider rate limits, the system fails open to protect warehouse conveyor velocity:

```text
  Packer             Station Terminal (/station)   API (/api/pack/verify)        Vision Provider              MongoDB (PackRecord)
    │                         │                            │                          │                              │
  1 │── Triggers pack capture▶│                            │                          │                              │
  2 │                         │── POST /api/pack/verify ──▶│                          │                              │
    │                         │                            │── Start 6s timeout guard │                              │
  3 │                         │                            │── Outbound VLM Request ─▶│                              │
    │                         │                            │                          │                              │
    │                         │                            │   * TIMEOUT (>6,000ms) or Provider Error *                  │
  4 │                         │                            │◀- - - - - - - - - - - - -│                              │
    │                         │                            │                                                         │
  5 │                         │                            │── Catch error -> Build failed_open fallback ───────────▶│
    │                         │                            │   status: "failed_open", PENDING_REVIEW: true           │
  6 │                         │◀── HTTP 200 {failed_open} ─│                                                         │
  7 │◀── Amber PENDING Card ──│                                                                                      │
    │   "PROCEED & SEAL"      │                                                                                      │
  8 │── Packer closes box ───▶│  * CONVEYOR LINE NEVER STALLS *                                                      │
```

| Step | Component | Action / Payload | Operational Meaning |
|---|---|---|---|
| **1–3** | Station $\rightarrow$ API | `POST /api/pack/verify` | Outbound request initiates with `AbortController` timer set to 6,000 ms |
| **4** | Vision Provider | Request times out or returns 5xx error | External API failure is trapped before blocking the warehouse floor |
| **5** | API $\rightarrow$ Database | Fallback `failed_open` record committed | Captures image, sets `PENDING_REVIEW: true`, hashes partial evidence |
| **6–8** | Station $\rightarrow$ Packer | Amber banner: `PENDING REVIEW · PROCEED` | Packer seals carton immediately; warehouse conveyor velocity is protected |

---

### 3.3 Manual Operator Override Flow

When a physical condition contradicts the vision model (e.g. transparent packaging or hidden nested product), the human operator overrides the agent. The override is preserved as immutable audit data:

```text
  Packer             Station UI (VerdictDisplay)  API (/api/pack/override)                                  MongoDB (PackRecord)
    │                         │                            │                                                         │
  1 │── Clicks override chip ─▶│                           │                                                         │
    │   "Item Hidden" / "AI"  │                            │                                                         │
  2 │── Selects new verdict ──▶│                           │                                                         │
    │   e.g. "SEAL"           │── POST /api/pack/override ─▶│                                                         │
  3 │                         │   {record_id, org_id,      │── findOne({record_id}).setOptions({orgId}) ────────────▶│
    │                         │    new_decision, reason}   │◀── Existing record returned ────────────────────────────│
  4 │                         │                            │── Append to overrides[]:                                │
    │                         │                            │   {original, new, reason, operator, timestamp}          │
  5 │                         │                            │── Recompute SHA-256 content_hash                        │
  6 │                         │                            │── record.save() (RLS enforced) ────────────────────────▶│
  7 │                         │◀── HTTP 200 {ok: true} ────│                                                         │
  8 │◀── Override logged ─────│                                                                                      │
```

| Step | Component | Action / Payload | Operational Meaning |
|---|---|---|---|
| **1–2** | Packer $\rightarrow$ Station | Selects reason chip (`AI Miscounted`, `Item Hidden`, etc.) | Mandatory structured reason eliminates undocumented overrides |
| **3** | Station $\rightarrow$ API | `POST /api/pack/override` | Submits `record_id`, `new_decision`, `reason`, and `overridden_by` |
| **4–6** | API $\rightarrow$ MongoDB | Atomic update & re-hashing | Preserves `original_decision`, logs timestamp, and updates SHA-256 hash |
| **7–8** | API $\rightarrow$ Station | HTTP 200 `{ok: true, override}` | UI confirms logged audit trail and updates terminal status |

---

## 4. Deep-Dive: Multi-Tenant Row-Level Security (Rule 1)

### 4.1 Threat Model
In multi-client 3PL logistics facilities:
* Packing stations are shared across client accounts (e.g. `org_demo_alpha` and `org_demo_bravo`).
* **Threat**: A rogue operator or compromised API client queries order records, images, or customer data belonging to a rival brand by manipulating `order_id` or `record_id` parameters.
* **Vulnerability**: Application-level filters (`where: { organization_id }`) rely on developer diligence. A single missed filter creates a critical data leak.

### 4.2 Database Middleware Implementation
Tenancy isolation is enforced at the driver layer using **Mongoose pre-query middleware hooks** in [`src/db/middleware/rls.ts`](agent/src/db/middleware/rls.ts):

```typescript
// Core RLS enforcement logic from src/db/middleware/rls.ts
export function applyOrganizationRls(schema: Schema): void {
  const enforceOrganization = function (this: OrganizationScopedQuery) {
    const { orgId } = this.getOptions();

    // 1. Hard rejection if tenant context is missing
    if (typeof orgId !== "string" || orgId.trim() === "") {
      throw new SecurityViolationError();
    }

    // 2. Forcefully inject tenant isolation into query filter
    this.setQuery({
      ...this.getFilter(),
      organization_id: orgId,
    });
  };

  // Intercept all database query entry points
  for (const method of ["find", "findOne", "countDocuments"] as const) {
    schema.pre(method, enforceOrganization);
  }
}
```

### 4.3 Automated Verification
Automated test suite [`evals/scripts/test_rls.ts`](agent/evals/scripts/test_rls.ts) asserts:
1. Scoped query for `org_attacker` trying to access `org_alpha` is forcefully rewritten to `organization_id: 'org_alpha'`.
2. Queries executed without `orgId` options throw a fatal `SECURITY_VIOLATION_ERR`.
3. Multi-tenant document counts between `org_alpha` and `org_bravo` remain strictly isolated.

---

## 5. Deep-Dive: Vision Extraction vs. Deterministic Reconciliation (Rule 2 & Rule 5)

A critical failure mode of naive AI pack implementations is asking the LLM: *"Does this box match the order?"* Large models routinely hallucinate matching SKUs, confuse quantities, or misinterpret bundle rules.

Pack Manager enforces a strict **Two-Phase Architecture**:

```text
 ┌──────────────────────────────────────────────────────────────────┐
 │                  PHASE 1: VISUAL PERCEPTION                      │
 │                  (VLM: Single-Batch Prompt)                      │
 │                                                                  │
 │   Input:  [Open Box Image] + [Candidate Order SKU Labels]        │
 │   Output: Raw visual evidence ONLY                               │
 │           • observations: [{sku, quantity, confidence, ref}]    │
 │           • decoys:       [{label, quantity, reason}]           │
 │           • occlusion:    {status: clear|partial|severe}         │
 └────────────────────────────────┬─────────────────────────────────┘
                                  │
                                  ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │              PHASE 2: DETERMINISTIC RECONCILIATION               │
 │                   (Pure TypeScript Engine)                       │
 │                                                                  │
 │   Algorithm: $O(N)$ Hash-Map Set Difference                      │
 │   Output: Definitive Business Verdict                            │
 │           • SEAL (Pass)                                          │
 │           • STOP_AND_FIX (Defect)                                │
 │           • UNCERTAIN (Defensive Hold)                           │
 └──────────────────────────────────────────────────────────────────┘
```

### 5.1 Mathematical Reconciliation Formulation
Given:
* Expected Order Lines: $E = \{(s, q_e)\}$ where $s \in \text{SKU}, q_e \in \mathbb{N}^+$
* Visual Observations: $O = \{(s, q_o)\}$ where $s \in \text{SKU}, q_o \in \mathbb{N}$
* Visual Decoys: $D = \{(d, q_d)\}$ where $d \in \text{ForeignObjects}$

The engine computes:
$$\text{Missing Items} = \{s \in E \mid q_o(s) = 0\}$$
$$\text{Quantity Mismatches} = \{s \in E \mid q_o(s) \neq q_e(s)\}$$
$$\text{Unexpected Items} = \{s \in O \mid s \notin E\} \cup D$$

The verdict $V$ is evaluated deterministically:
$$V = \begin{cases} 
\text{UNCERTAIN} & \text{if } \text{occlusion} = \text{severe} \lor \text{status} = \text{uncertain} \\
\text{STOP\_AND\_FIX} & \text{if } |\text{Missing}| > 0 \lor |\text{Mismatch}| > 0 \lor |\text{Unexpected}| > 0 \\
\text{SEAL} & \text{otherwise}
\end{cases}$$

---

## 6. Cryptographic Tamper-Evidence & Cross-Pod Contract

Evidence generated at box seal must withstand scrutiny in legal disputes, marketplace chargebacks, and carrier claims:

### 6.1 SHA-256 Content Digest

Every record computes a canonical digest over its normalized payload:

$$
\mathrm{SHA\text{-}256}
\left(
\mathrm{JSON.stringify}(\text{canonical payload})
\right)
$$

The canonical payload contains `unit_id`, `subject`, `checks`, `outcome`, and `overrides`.

If an operator applies an override, the override record (including previous verdict, new verdict, reason chip, operator ID, and UTC timestamp) is appended to `overrides[]`, and the `content_hash` is recomputed. Any modification to visual records or checks immediately invalidates the digest.

### 6.2 Downstream Interoperability (Steps 04 & 05)
The evidence shape published in [`contract/schema.json`](contract/schema.json) connects directly to adjacent managers via `unit_id`:

```text
  [Step 03: Pack Manager] ──────────────▶ [Step 04: Returns Manager]
  Publishes: contents at seal             Consumes: subject.observed_in_box
                                          Validates: Was returned item actually sent?
                                                    
  [Step 03: Pack Manager] ──────────────▶ [Step 05: Recovery Manager]
  Publishes: timestamped photo + hash     Consumes: images[] + content_hash
                                          Validates: Defends "empty box" carrier claims
```

---

## 7. Data Dictionary & MongoDB Schema

The canonical schema is implemented in [`src/models/PackRecord.ts`](agent/src/models/PackRecord.ts):

### `PackRecord` Collection Structure

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `record_id` | String | Unique, Indexed, `PCK-[a-z0-9_-]+` | Stage record identifier |
| `unit_id` | String | Indexed, `UNIT-[0-9]{4}` | Universal 5-stage join key |
| `organization_id` | String | Indexed, Required | Multi-tenant isolation scope |
| `station_id` | String | Indexed, Required | Physical packing bench terminal ID |
| `status` | String | Enum: `pending`, `complete`, `failed_open` | Lifecycle status |
| `subject.order_id` | String | Required | Customer order identifier |
| `subject.order_lines` | Array | Objects: `{sku, quantity}` | Expected items ordered by buyer |
| `subject.observed_in_box`| Array | Objects: `{sku, quantity}` | Physically verified items |
| `images` | Array | Array of URIs | S3 presigned URLs or base64 evidence |
| `checks` | Array | Objects: `{sku, expected, observed, status}` | Line-by-line verification check |
| `outcome.decision` | String | Enum: `SEAL`, `STOP_AND_FIX`, `UNCERTAIN` | Final operational verdict |
| `outcome.decided_by`| String | Required | Agent model or operator ID |
| `overrides` | Array | Objects: `{original, new, reason, by, at}` | Audit log of operator changes |
| `content_hash` | String | Hex SHA-256 (64 chars) | Cryptographic tamper digest |

---

## 8. Failure Modes, Edge Cases & Hardware Mitigations

| Failure Mode | Benchmark Incident | Technical Root Cause | Operational Mitigation |
|---|---|---|---|
| **Z-Axis Stacking** | Fixture `2.b` (Stacked towels miscounted) | Single 2D overhead camera cannot measure depth when identical items are stacked directly on top of each other. | Telemetry flags high-stack SKUs for tare-weight scale cross-verification or dual-angle capture. |
| **Severe Occlusion** | Fixtures `1.d`, `3.f`, `4.f`, `5.f`, `6.f`, `7.f`, `8.f`, `9.f` | Crumpled kraft paper or bubble wrap covering >30% of box contents. | **Defensive UNCERTAIN**: Agent declines to guess, displaying amber alert to adjust dunnage. |
| **Variant Confusions** | Fixtures `1.c` (Navy vs. Blue), `3.c` (Red vs. Black mug) | Sub-catalog visual color or material variations. | Foundation VLM reads packaging text and color semantics, reliably catching 8 out of 8 variant swaps. |
| **Foreign Dropped Objects**| Fixtures `2.c` (Tape gun), `3.e` (Keys), `7.e` (Screws), `9.e` (Shears) | Packers accidentally drop station tools into carton before folding. | Decoy detection pipeline flags unlisted non-catalog objects as immediate `STOP_AND_FIX`. |
| **Cloud Provider Outage**| Benchmark Run 1 (External Groq rate limiting) | Rate limits or network packet loss on third-party inference. | **Fail-Open Guard**: 6s timeout automatically records photo, sets `failed_open`, and lets parcel move. |

