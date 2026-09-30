import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { connectToDatabase } from "@/db/connect";
import { PackRecordModel, type PackDecision } from "@/models/PackRecord";

export const runtime = "nodejs";

const decisions = new Set<PackDecision>(["SEAL", "STOP_AND_FIX", "UNCERTAIN"]);

type OverrideRequest = {
  record_id: string;
  organization_id: string;
  new_decision: PackDecision;
  reason: string;
  overridden_by: string;
};

function isOverrideRequest(value: unknown): value is OverrideRequest {
  if (!value || typeof value !== "object") {
    return false;
  }

  const request = value as Partial<OverrideRequest>;
  return (
    typeof request.record_id === "string" &&
    typeof request.organization_id === "string" &&
    typeof request.new_decision === "string" &&
    decisions.has(request.new_decision as PackDecision) &&
    typeof request.reason === "string" &&
    request.reason.trim().length > 0 &&
    typeof request.overridden_by === "string" &&
    request.overridden_by.trim().length > 0
  );
}

function contentHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  if (!isOverrideRequest(body)) {
    return NextResponse.json(
      { error: "record_id, organization_id, new_decision, reason, and overridden_by are required" },
      { status: 400 },
    );
  }

  await connectToDatabase();
  const record = await PackRecordModel.findOne({ record_id: body.record_id }).setOptions({
    orgId: body.organization_id,
  });

  if (!record) {
    return NextResponse.json({ error: "Pack record not found" }, { status: 404 });
  }

  if (record.outcome.decision === body.new_decision) {
    return NextResponse.json({ error: "Override must change the current decision" }, { status: 400 });
  }

  const override = {
    original_decision: record.outcome.decision,
    new_decision: body.new_decision,
    reason: body.reason.trim(),
    overridden_by: body.overridden_by.trim(),
    overridden_at: new Date(),
  };

  record.overrides.push(override);
  record.outcome = {
    decision: body.new_decision,
    decided_by: body.overridden_by.trim(),
  };
  record.content_hash = contentHash({
    ...record.toObject(),
    content_hash: undefined,
  });
  await record.save();

  return NextResponse.json({ ok: true, override, record_id: record.record_id });
}