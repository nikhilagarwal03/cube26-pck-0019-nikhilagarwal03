import assert from "node:assert/strict";

import { model, Schema } from "mongoose";

import { applyOrganizationRls, SECURITY_VIOLATION_ERR } from "../../src/db/middleware/rls";

type HookSchema = Schema & {
  s: {
    hooks: {
      execPre: (method: string, context: unknown, callback: (error?: Error) => void) => void;
    };
  };
};

async function executePre(schema: Schema, method: string, query: unknown): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    (schema as HookSchema).s.hooks.execPre(method, query, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function main() {
  const schema = new Schema({ organization_id: String });
  applyOrganizationRls(schema);
  const testModel = model("RlsIsolationTest", schema);

  const scopedQuery = testModel.find({ organization_id: "org_attacker" }).setOptions({
    orgId: "org_alpha",
  });
  await executePre(schema, "find", scopedQuery);
  assert.equal(scopedQuery.getFilter().organization_id, "org_alpha");

  const missingContextQuery = testModel.find({});
  await assert.rejects(
    executePre(schema, "find", missingContextQuery),
    (error: unknown) => error instanceof Error && error.name === SECURITY_VIOLATION_ERR,
  );

  const countQuery = testModel.countDocuments({ organization_id: "org_attacker" }).setOptions({
    orgId: "org_bravo",
  });
  await executePre(schema, "countDocuments", countQuery);
  assert.equal(countQuery.getFilter().organization_id, "org_bravo");

  console.log("RLS isolation checks passed: find, countDocuments, missing-context rejection");
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});