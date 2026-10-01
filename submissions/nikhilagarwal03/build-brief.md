# Engineering Build Brief: Pack Manager (03)

**Author:** Nikhil Agarwal (`nikhilagarwal03`)  
**Repository:** `cube26-pck-0019-nikhilagarwal03`  
**Date:** September – October 2026  

---

## 1. Problem Statement & Operational Boundary

The Pack Manager is Step 3 of the 5-stage physical commerce chain (Receiving $\rightarrow$ Prep $\rightarrow$ **Pack** $\rightarrow$ Returns $\rightarrow$ Recovery). In merchant-fulfilled (Amazon MFN, Shopify, Walmart) and 3PL packing stations, human operators pack cartons under tight cycle times. 

Errors occur in four major categories:
1. **Missing Items**: Short packing an order line.
2. **Quantity Mismatches**: Too few or excess units placed in the carton.
3. **Variant Swaps**: Picking dark blue bath towels instead of light blue, or yellow notepads instead of green.
4. **Foreign Objects / Decoys**: Accidental dropping of packaging tape, scissors, personal keys, or warehouse tools into the box.

The operational challenge is to verify carton contents at seal **without hardware capex** and **without slowing packing speeds**.

---

## 2. Key Architecture & Technology Decisions

### Decision 1: Foundation Vision Model vs. Per-SKU Fine-Tuned Detectors
* **Choice**: `meta-llama/llama-3.2-90b-vision-instruct` / `qwen/qwen3.8-27b` via Groq.
* **Trade-Off**: Per-SKU object detectors (e.g. YOLO) offer millisecond local inference but require labeled training images and bounding boxes for every SKU. A mid-market 3PL handles thousands of evolving SKUs every month. Foundation vision models provide zero-shot label reading, barcode recognition, and semantic distinction (e.g., distinguishing navy vs. light blue towels) with zero training overhead.

### Decision 2: Decoupled Deterministic Reconciliation Engine
* **Choice**: Pure TypeScript reconciliation engine (`src/lib/reconciliation/engine.ts`).
* **Trade-Off**: Allowing an LLM to directly issue business verdicts like `SEAL` or `STOP_AND_FIX` leads to hallucinations and non-reproducible edge-case handling. Instead, the model outputs structured visual evidence only (`observations[]`, `decoys[]`, `occlusion`). Deterministic business logic compares observed items against order lines mathematically.

### Decision 3: Fail-Open Guard (6-Second Timeout)
* **Choice**: Asynchronous timeout guard wrapping the verify route.
* **Trade-Off**: A fail-closed system halts the packing line if an external API suffers rate limits or network degradation. A fail-open system saves the open-box photo, marks the record `failed_open` (`PENDING_REVIEW: true`), and allows the operator to seal the carton, ensuring warehouse throughput is never throttled.

### Decision 4: Row-Level Security at Mongoose Middleware Layer
* **Choice**: Mongoose query pre-hooks (`src/db/middleware/rls.ts`).
* **Trade-Off**: Application-level `where: { org_id }` queries are prone to developer omission. By enforcing multi-tenant scoping inside the Mongoose schema middleware, any query executed without tenant context is rejected with a `SecurityViolationError`.

---

## 3. Evaluation Findings & Unresolved Technical Challenges

1. **The Z-Axis Occlusion Limit (Fixture 2.b)**:
   * A single overhead 2D camera cannot reliably measure depth or count flat objects stacked directly atop one another (e.g., folded towels). Both the vision model and human Labeler B miscounted the 3-towel stack as 2 towels. Solving this without capex requires either an automated weight-scale cross-check or angled multi-view captures.
2. **Defensive Reasoning on Occlusion**:
   * Out of 50 test fixtures, all 8 heavily occluded packages (crinkled paper, bubble wrap) were reliably routed to `UNCERTAIN` rather than guessing, validating the agent's defensive operational behavior.

