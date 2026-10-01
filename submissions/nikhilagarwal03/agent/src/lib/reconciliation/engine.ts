import type { VisionResult } from "@/lib/vision/groq";

export type ExpectedOrderLine = {
  sku: string;
  quantity: number;
};

export type ReconciliationInput = {
  order_lines: readonly ExpectedOrderLine[];
  extracted: VisionResult;
};

export type QuantityMismatch = {
  sku: string;
  expected: number;
  observed: number;
};

export type ReconciliationResult = {
  all_items_present: boolean;
  quantities_correct: boolean;
  missing_items: string[];
  quantity_mismatches: QuantityMismatch[];
  unexpected_items: Array<{
    sku: string;
    quantity: number;
    reason: string;
  }>;
  verdict: "SEAL" | "STOP_AND_FIX" | "UNCERTAIN";
  reason: string;
};

function aggregateItems(
  items: readonly { sku: string; quantity: number }[],
): Map<string, number> {
  const totals = new Map<string, number>();

  for (const item of items) {
    const sku = item.sku.trim();
    if (!sku) {
      continue;
    }
    totals.set(sku, (totals.get(sku) ?? 0) + item.quantity);
  }

  return totals;
}

export function reconcilePack({
  order_lines,
  extracted,
}: ReconciliationInput): ReconciliationResult {
  const expected = aggregateItems(order_lines);
  const observed = aggregateItems(extracted.observations);
  const missing_items: string[] = [];
  const quantity_mismatches: QuantityMismatch[] = [];
  const unexpected_items: ReconciliationResult["unexpected_items"] = [];

  for (const [sku, expectedQuantity] of expected) {
    const observedQuantity = observed.get(sku) ?? 0;

    if (observedQuantity === 0) {
      missing_items.push(sku);
    }

    if (observedQuantity !== expectedQuantity) {
      quantity_mismatches.push({
        sku,
        expected: expectedQuantity,
        observed: observedQuantity,
      });
    }
  }

  for (const [sku, quantity] of observed) {
    if (!expected.has(sku)) {
      unexpected_items.push({
        sku,
        quantity,
        reason: sku === "UNKNOWN" ? "The visible SKU could not be identified" : "SKU was not ordered",
      });
    }
  }

  for (const decoy of extracted.decoys) {
    unexpected_items.push({
      sku: decoy.label,
      quantity: decoy.quantity,
      reason: decoy.reason,
    });
  }

  const all_items_present = missing_items.length === 0;
  const quantities_correct = quantity_mismatches.length === 0;
  const hasUncertainEvidence =
    extracted.status === "uncertain" || extracted.occlusion.status !== "clear";

  let verdict: ReconciliationResult["verdict"];
  let reason: string;

  if (hasUncertainEvidence) {
    verdict = "UNCERTAIN";
    reason = extracted.reason || "The visual evidence is insufficient for a reliable decision.";
  } else if (!all_items_present || !quantities_correct || unexpected_items.length > 0) {
    verdict = "STOP_AND_FIX";
    reason = "Expected contents do not match the extracted package contents.";
  } else {
    verdict = "SEAL";
    reason = "Every expected SKU is present at the expected quantity and no extras were found.";
  }

  return {
    all_items_present,
    quantities_correct,
    missing_items,
    quantity_mismatches,
    unexpected_items,
    verdict,
    reason,
  };
}