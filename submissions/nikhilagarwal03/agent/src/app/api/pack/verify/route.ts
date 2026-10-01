import { createHash, randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { connectToDatabase } from "@/db/connect";
import { reconcilePack, type ReconciliationResult } from "@/lib/reconciliation/engine";
import { analyzePackImage } from "@/lib/vision/groq";
import {
  PackRecordModel,
  type PackCheck,
  type PackItem,
  type PackRecord,
} from "@/models/PackRecord";

export const runtime = "nodejs";

const VERIFY_TIMEOUT_MS = 6_000;

type VerifyRequest = {
  record_id?: string;
  unit_id: string;
  organization_id: string;
  station_id: string;
  order_id: string;
  order_lines: PackItem[];
  image_url: string;
  images?: string[];
  decided_by?: string;
};

function buildChecks(
  orderLines: PackItem[],
  reconciliation: ReconciliationResult,
): PackCheck[] {
  const mismatches = new Map(
    reconciliation.quantity_mismatches.map((mismatch) => [mismatch.sku, mismatch]),
  );

  return orderLines.map((line) => {
    const mismatch = mismatches.get(line.sku);
    const isUncertain = reconciliation.verdict === "UNCERTAIN";

    return {
      sku: line.sku,
      expected_quantity: line.quantity,
      observed_quantity: mismatch?.observed ?? line.quantity,
      status: isUncertain ? "UNCERTAIN" : mismatch ? "FAIL" : "PASS",
      ...(mismatch ? { issue: `Expected ${mismatch.expected}, observed ${mismatch.observed}` } : {}),
    };
  });
}

function createContentHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function isVerifyRequest(value: unknown): value is VerifyRequest {
  if (!value || typeof value !== "object") {
    return false;
  }

  const request = value as Partial<VerifyRequest>;
  return (
    typeof request.unit_id === "string" &&
    typeof request.organization_id === "string" &&
    typeof request.station_id === "string" &&
    typeof request.order_id === "string" &&
    typeof request.image_url === "string" &&
    Array.isArray(request.order_lines) &&
    request.order_lines.every(
      (line) =>
        line &&
        typeof line.sku === "string" &&
        Number.isInteger(line.quantity) &&
        line.quantity >= 0,
    )
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  if (!isVerifyRequest(body)) {
    return NextResponse.json(
      { error: "unit_id, organization_id, station_id, order_id, image_url, and order_lines are required" },
      { status: 400 },
    );
  }

  const recordId = body.record_id ?? `PCK-${randomUUID()}`;
  const images = body.images ?? [body.image_url];
  const baseRecord = {
    record_id: recordId,
    unit_id: body.unit_id,
    organization_id: body.organization_id,
    station_id: body.station_id,
    subject: {
      order_id: body.order_id,
      order_lines: body.order_lines,
      observed_in_box: [],
    },
    images,
    checks: [],
    outcome: { decision: "UNCERTAIN" as const, decided_by: body.decided_by ?? "pack-manager" },
    overrides: [],
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

  try {
    const extracted = await analyzePackImage({
      imageUrl: body.image_url,
      expectedSkus: body.order_lines.map((line) => line.sku),
      signal: controller.signal,
    });
    const reconciliation = reconcilePack({
      order_lines: body.order_lines,
      extracted,
    });
    const record: Omit<PackRecord, "content_hash"> = {
      ...baseRecord,
      status: "complete",
      subject: {
        ...baseRecord.subject,
        observed_in_box: extracted.observations,
      },
      checks: buildChecks(body.order_lines, reconciliation),
      outcome: {
        decision: reconciliation.verdict,
        decided_by: body.decided_by ?? "pack-manager",
      },
    };

    await connectToDatabase();
    const saved = await PackRecordModel.create({
      ...record,
      content_hash: createContentHash(record),
    });

    return NextResponse.json({
      PENDING_REVIEW: reconciliation.verdict === "UNCERTAIN",
      record_id: saved.record_id,
      reconciliation,
    });
  } catch (error) {
    const failedRecord: Omit<PackRecord, "content_hash"> = {
      ...baseRecord,
      status: "failed_open",
    };

    await connectToDatabase();
    const saved = await PackRecordModel.create({
      ...failedRecord,
      content_hash: createContentHash(failedRecord),
    });

    return NextResponse.json(
      {
        PENDING_REVIEW: true,
        status: "failed_open",
        record_id: saved.record_id,
        message: "Pack verification is pending review",
        error: error instanceof Error ? error.message : "Pack verification failed",
      },
      { status: 200 },
    );
  } finally {
    clearTimeout(timeout);
  }
}