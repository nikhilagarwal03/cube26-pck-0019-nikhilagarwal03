import { model, models, Schema, type Document } from "mongoose";

import { applyOrganizationRls } from "@/db/middleware/rls";

export type PackCheckStatus = "PASS" | "FAIL" | "UNCERTAIN";
export type PackDecision = "SEAL" | "STOP_AND_FIX" | "UNCERTAIN";
export type PackRecordStatus = "pending" | "complete" | "failed_open";

export interface PackItem {
  sku: string;
  quantity: number;
}

export interface PackSubject {
  order_id: string;
  order_lines: PackItem[];
  observed_in_box: PackItem[];
}

export interface PackCheck {
  sku: string;
  expected_quantity: number;
  observed_quantity: number | null;
  status: PackCheckStatus;
  issue?: string;
}

export interface PackOutcome {
  decision: PackDecision;
  decided_by: string;
}

export interface PackOverride {
  original_decision: PackDecision;
  new_decision: PackDecision;
  reason: string;
  overridden_by: string;
  overridden_at: Date;
}

export interface PackRecord {
  record_id: string;
  unit_id: string;
  organization_id: string;
  station_id: string;
  status: PackRecordStatus;
  subject: PackSubject;
  images: string[];
  checks: PackCheck[];
  outcome: PackOutcome;
  overrides: PackOverride[];
  content_hash: string;
}

export type PackRecordDocument = PackRecord & Document;

const packItemSchema = new Schema<PackItem>(
  {
    sku: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const packSubjectSchema = new Schema<PackSubject>(
  {
    order_id: { type: String, required: true, trim: true },
    order_lines: { type: [packItemSchema], required: true },
    observed_in_box: { type: [packItemSchema], required: true },
  },
  { _id: false },
);

const packCheckSchema = new Schema<PackCheck>(
  {
    sku: { type: String, required: true, trim: true },
    expected_quantity: { type: Number, required: true, min: 0 },
    observed_quantity: { type: Number, min: 0, default: null },
    status: {
      type: String,
      enum: ["PASS", "FAIL", "UNCERTAIN"],
      required: true,
    },
    issue: { type: String, trim: true },
  },
  { _id: false },
);

const packOutcomeSchema = new Schema<PackOutcome>(
  {
    decision: {
      type: String,
      enum: ["SEAL", "STOP_AND_FIX", "UNCERTAIN"],
      required: true,
    },
    decided_by: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const packOverrideSchema = new Schema<PackOverride>(
  {
    original_decision: {
      type: String,
      enum: ["SEAL", "STOP_AND_FIX", "UNCERTAIN"],
      required: true,
    },
    new_decision: {
      type: String,
      enum: ["SEAL", "STOP_AND_FIX", "UNCERTAIN"],
      required: true,
    },
    reason: { type: String, required: true, trim: true },
    overridden_by: { type: String, required: true, trim: true },
    overridden_at: { type: Date, required: true },
  },
  { _id: false },
);

export const packRecordSchema = new Schema<PackRecordDocument>(
  {
    record_id: { type: String, required: true, unique: true, index: true, trim: true },
    unit_id: { type: String, required: true, index: true, trim: true },
    organization_id: { type: String, required: true, index: true, trim: true },
    station_id: { type: String, required: true, index: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "complete", "failed_open"],
      required: true,
    },
    subject: { type: packSubjectSchema, required: true },
    images: { type: [String], required: true, default: [] },
    checks: { type: [packCheckSchema], required: true, default: [] },
    outcome: { type: packOutcomeSchema, required: true },
    overrides: { type: [packOverrideSchema], required: true, default: [] },
    content_hash: { type: String, required: true, trim: true },
  },
  { timestamps: true, strict: true },
);

applyOrganizationRls(packRecordSchema);

export const PackRecordModel =
  models.PackRecord || model<PackRecordDocument>("PackRecord", packRecordSchema);

export default PackRecordModel;