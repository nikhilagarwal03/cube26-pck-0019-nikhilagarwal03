# Cross-Pod Evidence Contract: Pack Manager (Step 03)

## Overview

The Pack Manager is Step 3 in the 5-stage physical commerce chain:
```text
 01 Receiving ──▶ 02 Prep ──▶ 03 Pack ──▶ 04 Returns ──▶ 05 Recovery
 (inbound)        (compliance) (seal)     (inspection)  (claims)
```

At box seal, the Pack Manager inspects open box contents and publishes an immutable evidence record bound to `unit_id`.

## Schema Definition

The canonical JSON Schema is located in [`schema.json`](schema.json).

### Primary Keys & Join Semantics

| Field | Meaning | Usage |
|---|---|---|
| `unit_id` | Physical item tracking key (`UNIT-0001` .. `UNIT-0100`) | Joins across Receiving, Prep, Pack, Returns, and Recovery. |
| `record_id` | Unique pack stage record identifier (`PCK-...`) | Referenced in audit logs and carrier disputes. |
| `organization_id` | Multi-tenant identifier (`org_demo_alpha`, `org_demo_bravo`) | Enforces row-level security isolation. |
| `content_hash` | SHA-256 digest of normalized record fields | Proves the record has not been altered post-seal. |

## Consumers

### 1. Step 04: Returns Manager
* **Question Answered**: *“What was actually in the box when it left the warehouse?”*
* **Consumption**: When a customer files a return claiming "Wrong Item Sent" or "Missing Item", the Returns Manager queries `PackRecord` by `unit_id` to compare `subject.observed_in_box` against the physical item returned to the dock.

### 2. Step 05: Recovery Manager
* **Question Answered**: *“Did the warehouse pack the correct items and quantity before handing off to the carrier?”*
* **Consumption**: For "Item Not Received" or "Empty Box" carrier and marketplace claims, the Recovery Manager pulls the Pack Manager's `images` and `checks` as cryptographic proof of outbound fulfillment to refute buyer fraud.

## Tri-State Decisions

* **`SEAL`** (`PASS`): All expected order lines are confirmed present and correct; no extras or foreign items; box may be closed.
* **`STOP_AND_FIX`**: Quantity mismatch, missing items, or wrong variant detected. Warehouse packer must rectify before sealing.
* **`UNCERTAIN`**: Severe occlusion (e.g. bubble wrap, kraft paper) or visual ambiguity prevents definitive count. Routes to manual inspection.

## Fail-Open Guarantee

If the vision model times out (>6s) or encounters an API failure, the record status is set to `failed_open` with `outcome.decision = "UNCERTAIN"`. The capture is preserved in `images`, allowing operators to proceed without stalling conveyor throughput.

## Manual Overrides

When an operator overrides the automated verdict, the system records:
* `original_decision`
* `new_decision`
* `reason` (e.g. "AI Miscounted", "Item Hidden", "Wrong SKU", "Camera Issue")
* `overridden_by`
* `overridden_at`
The `content_hash` is recomputed to encompass the override trail.

