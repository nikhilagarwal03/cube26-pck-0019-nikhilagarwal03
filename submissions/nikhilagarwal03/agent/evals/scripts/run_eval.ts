import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { reconcilePack, type ReconciliationResult } from "../../src/lib/reconciliation/engine";
import { analyzePackImage } from "../../src/lib/vision/groq";

type Fixture = {
  fixture_id: string;
  category: string;
  image_url: string;
  expected_order: Array<{ sku: string; quantity: number }>;
  ground_truth: {
    final_verdict: "PASS" | "STOP_AND_FIX" | "UNCERTAIN";
    all_items_present: boolean | null;
    quantities_correct: boolean | null;
    occlusion_state: "NONE" | "SEVERE";
  };
  labeler_a?: Fixture["ground_truth"];
  labeler_b?: Fixture["ground_truth"];
};

type EvalResult = {
  fixture_id: string;
  category: string;
  ground_truth: Fixture["ground_truth"];
  ai_verdict: "PASS" | "STOP_AND_FIX" | "UNCERTAIN" | "ERROR";
  all_items_present: boolean | null;
  quantities_correct: boolean | null;
  verdict_match: boolean;
  error?: string;
};

function normalizeVerdict(result: ReconciliationResult): EvalResult["ai_verdict"] {
  if (result.verdict === "SEAL") {
    return "PASS";
  }
  return result.verdict;
}

function percentage(value: number, total: number): string {
  return total === 0 ? "N/A" : `${((value / total) * 100).toFixed(2)}%`;
}

function calculateCohenKappa(fixtures: Fixture[]) {
  const pairs = fixtures
    .filter((fixture) => fixture.labeler_a && fixture.labeler_b)
    .map((fixture) => [fixture.labeler_a!.final_verdict, fixture.labeler_b!.final_verdict] as const);

  if (pairs.length === 0) {
    return {
      status: "NOT_AVAILABLE",
      value: null,
      paired_units: 0,
      reason: "Two independent labeller outputs are required; fixtures currently contain one ground_truth label.",
    };
  }

  const labels = [...new Set(pairs.flat())];
  const observedAgreement = pairs.filter(([first, second]) => first === second).length / pairs.length;
  const expectedAgreement = labels.reduce((sum, label) => {
    const firstRate = pairs.filter(([first]) => first === label).length / pairs.length;
    const secondRate = pairs.filter(([, second]) => second === label).length / pairs.length;
    return sum + firstRate * secondRate;
  }, 0);
  const value = expectedAgreement === 1
    ? 1
    : (observedAgreement - expectedAgreement) / (1 - expectedAgreement);

  return {
    status: "AVAILABLE",
    value: Number(value.toFixed(4)),
    paired_units: pairs.length,
    observed_agreement_percent: Number((observedAgreement * 100).toFixed(2)),
  };
}

const awsConfig = (() => {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (
    typeof region !== "string" ||
    typeof accessKeyId !== "string" ||
    typeof secretAccessKey !== "string" ||
    accessKeyId.startsWith("replace-with-") ||
    secretAccessKey.startsWith("replace-with-")
  ) {
    return null;
  }

  return { region, accessKeyId, secretAccessKey };
})();

const s3Client = awsConfig
  ? new S3Client({
      region: awsConfig.region,
      credentials: {
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
      },
    })
  : null;

async function resolveImageUrl(imageUrl: string): Promise<string> {
  const resolvedUrl = imageUrl
    .replace("[YOUR_AWS_S3_BUCKET_NAME]", process.env.AWS_S3_BUCKET_NAME ?? "[YOUR_AWS_S3_BUCKET_NAME]")
    .replace("[AWS_REGION]", process.env.AWS_REGION ?? "[AWS_REGION]");

  if (!s3Client || !awsConfig || !process.env.AWS_S3_BUCKET_NAME) {
    throw new Error("AWS S3 credentials are not configured for private fixture evaluation");
  }

  const key = new URL(resolvedUrl).pathname.replace(/^\//, "");
  return getSignedUrl(
    s3Client,
    new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: key }),
    { expiresIn: 300 },
  );
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function analyzeWithRetry(fixture: Fixture) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await analyzePackImage({
        imageUrl: await resolveImageUrl(fixture.image_url),
        expectedSkus: fixture.expected_order.map((line) => line.sku),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown evaluation error";
      if (!message.includes("429") || attempt === 2) {
        throw error;
      }
      const retryAfterSeconds = Number(message.match(/try again in ([\d.]+)s/)?.[1] ?? 10);
      await wait(Math.ceil(retryAfterSeconds * 1_000) + 1_000);
    }
  }

  throw new Error("Vision retry budget exhausted");
}

async function main() {
  const root = process.cwd();
  const fixturePath = path.join(root, "evals", "data", "test_fixtures.json");
  const resultPath = path.join(root, "evals", "results", "run_1.json");
  const fixtures = JSON.parse(await readFile(fixturePath, "utf8")) as Fixture[];
  const results: EvalResult[] = [];

  for (const fixture of fixtures) {
    try {
      const extracted = await analyzeWithRetry(fixture);
      const reconciliation = reconcilePack({
        order_lines: fixture.expected_order,
        extracted,
      });
      const aiVerdict = normalizeVerdict(reconciliation);

      results.push({
        fixture_id: fixture.fixture_id,
        category: fixture.category,
        ground_truth: fixture.ground_truth,
        ai_verdict: aiVerdict,
        all_items_present: reconciliation.all_items_present,
        quantities_correct: reconciliation.quantities_correct,
        verdict_match: aiVerdict === fixture.ground_truth.final_verdict,
      });
    } catch (error) {
      results.push({
        fixture_id: fixture.fixture_id,
        category: fixture.category,
        ground_truth: fixture.ground_truth,
        ai_verdict: "ERROR",
        all_items_present: null,
        quantities_correct: null,
        verdict_match: false,
        error: error instanceof Error ? error.message : "Unknown evaluation error",
      });
    }
  }

  const totalRuns = results.length;
  const errorCount = results.filter((result) => result.ai_verdict === "ERROR").length;
  const evaluatedResults = results.filter((result) => result.ai_verdict !== "ERROR");
  const truePositives = evaluatedResults.filter(
    (result) => result.ai_verdict === "STOP_AND_FIX" && result.ground_truth.final_verdict === "STOP_AND_FIX",
  ).length;
  const trueNegatives = evaluatedResults.filter(
    (result) => result.ai_verdict !== "STOP_AND_FIX" && result.ground_truth.final_verdict !== "STOP_AND_FIX",
  ).length;
  const falsePositives = evaluatedResults.filter(
    (result) => result.ai_verdict === "STOP_AND_FIX" && result.ground_truth.final_verdict !== "STOP_AND_FIX",
  ).length;
  const falseNegatives = evaluatedResults.filter(
    (result) => result.ai_verdict !== "STOP_AND_FIX" && result.ground_truth.final_verdict === "STOP_AND_FIX",
  ).length;
  const uncertainCount = evaluatedResults.filter((result) => result.ai_verdict === "UNCERTAIN").length;
  const exactMatches = evaluatedResults.filter((result) => result.verdict_match).length;
  const presenceCases = evaluatedResults.filter((result) => result.ground_truth.all_items_present !== null);
  const quantityCases = evaluatedResults.filter((result) => result.ground_truth.quantities_correct !== null);
  const presenceCorrect = presenceCases.filter(
    (result) => result.all_items_present === result.ground_truth.all_items_present,
  ).length;
  const quantityCorrect = quantityCases.filter(
    (result) => result.quantities_correct === result.ground_truth.quantities_correct,
  ).length;

  const summary = {
    total_runs: totalRuns,
    evaluated_runs: evaluatedResults.length,
    error_count: errorCount,
    true_positives: truePositives,
    true_negatives: trueNegatives,
    false_positives: falsePositives,
    false_negatives: falseNegatives,
    uncertain_count: uncertainCount,
    overall_accuracy_percent: percentage(exactMatches, evaluatedResults.length),
    false_positive_rate_percent: percentage(falsePositives, falsePositives + trueNegatives),
    false_negative_rate_percent: percentage(falseNegatives, falseNegatives + truePositives),
    all_items_present_accuracy_percent: percentage(presenceCorrect, presenceCases.length),
    quantities_correct_accuracy_percent: percentage(quantityCorrect, quantityCases.length),
    cohen_kappa: calculateCohenKappa(fixtures),
    metric_definition: "TP/TN/FP/FN treat STOP_AND_FIX as the positive operational class; overall accuracy requires exact verdict equality.",
  };

  await mkdir(path.dirname(resultPath), { recursive: true });
  await writeFile(resultPath, JSON.stringify({ run_id: "run_1", summary, results }, null, 2));

  console.log("\nPack Manager headless evaluation");
  console.table([
    { Metric: "Total Runs", Value: summary.total_runs },
    { Metric: "Evaluated Runs", Value: summary.evaluated_runs },
    { Metric: "Error Count", Value: summary.error_count },
    { Metric: "True Positives", Value: summary.true_positives },
    { Metric: "True Negatives", Value: summary.true_negatives },
    { Metric: "False Positives", Value: summary.false_positives },
    { Metric: "False Negatives", Value: summary.false_negatives },
    { Metric: "UNCERTAIN Count", Value: summary.uncertain_count },
    { Metric: "Overall Accuracy", Value: summary.overall_accuracy_percent },
    { Metric: "False Positive Rate", Value: summary.false_positive_rate_percent },
    { Metric: "False Negative Rate", Value: summary.false_negative_rate_percent },
    { Metric: "all_items_present Accuracy", Value: summary.all_items_present_accuracy_percent },
    { Metric: "quantities_correct Accuracy", Value: summary.quantities_correct_accuracy_percent },
    { Metric: "Cohen kappa", Value: summary.cohen_kappa.value ?? summary.cohen_kappa.status },
  ]);
  console.log(`Results written to ${path.relative(root, resultPath)}`);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});