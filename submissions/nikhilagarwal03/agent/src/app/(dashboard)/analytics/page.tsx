"use client";

import Link from "next/link";
import { Logo } from "@/components/branding/Logo";
import { DashboardNav } from "@/components/DashboardNav";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DailyCheckMetric = {
  pass: number;
  fail: number;
  uncertain: number;
};

type PackAnalyticsDaily = {
  date: string;
  organization_id: string;
  protected_revenue_usd: number;
  average_inference_latency_ms: number;
  uncertain_rate_percent: number;
  total_units_verified: number;
  checks: {
    all_items_present: DailyCheckMetric;
    quantities_correct: DailyCheckMetric;
  };
  manual_overrides_by_operator: Array<{ operator_id: string; overrides: number }>;
  operator_error_catch_rate: Array<{
    operator_id: string;
    caught: number;
    eligible: number;
    rate_percent: number;
  }>;
  defect_types: Array<{ type: string; count: number }>;
  high_risk_skus: Array<{ sku: string; stop_conditions: number; units_seen: number }>;
};

const analytics: PackAnalyticsDaily = {
  date: "2026-10-01",
  organization_id: "org_demo_alpha",
  protected_revenue_usd: 1815,
  average_inference_latency_ms: 1845,
  uncertain_rate_percent: 16.0,
  total_units_verified: 50,
  checks: {
    all_items_present: { pass: 26, fail: 16, uncertain: 8 },
    quantities_correct: { pass: 34, fail: 8, uncertain: 8 },
  },
  manual_overrides_by_operator: [
    { operator_id: "Labeler B", overrides: 2 },
    { operator_id: "AI Model", overrides: 1 },
    { operator_id: "Labeler A", overrides: 1 },
  ],
  operator_error_catch_rate: [
    { operator_id: "Consensus GT", caught: 34, eligible: 34, rate_percent: 100 },
    { operator_id: "Labeler A", caught: 34, eligible: 34, rate_percent: 100 },
    { operator_id: "AI (Llama 3.2)", caught: 33, eligible: 34, rate_percent: 97.1 },
    { operator_id: "Labeler B", caught: 33, eligible: 34, rate_percent: 97.1 },
  ],
  defect_types: [
    { type: "Missing Item", count: 8 },
    { type: "Quantity Mismatch", count: 9 },
    { type: "Variant / Wrong Item", count: 9 },
    { type: "Extra Foreign Item", count: 8 },
    { type: "Severe Occlusion", count: 8 },
  ],
  high_risk_skus: [
    { sku: "SKU-BATH-TOWEL-LIGHT-BLUE", stop_conditions: 6, units_seen: 16 },
    { sku: "SKU-BATH-SOAP-LAVENDER", stop_conditions: 6, units_seen: 8 },
    { sku: "SKU-APPAREL-TSHIRT-WHITE", stop_conditions: 4, units_seen: 12 },
    { sku: "SKU-HARDGOOD-MUG-BLACK", stop_conditions: 4, units_seen: 6 },
    { sku: "SKU-GROCERY-BASIL-JAR", stop_conditions: 4, units_seen: 12 },
  ],
};

const defectColors = ["#ef4444", "#f59e0b", "#3b82f6", "#10b981", "#a1a1aa"];

const evaluationRun = {
  id: "eval-run-2026-10-01-01",
  fixtures: 50,
  evaluated: 50,
  errors: 0,
  accuracy: "95.45%",
  kappa: "0.88",
  note: "meta-llama/llama-3.2-90b-vision-instruct · second successful run",
};

function MetricCard({ label, value, detail, accent }: { label: string; value: string; detail: string; accent: string }) {
  return (
    <article className="h-40 border border-zinc-800 bg-zinc-900/70 p-4">
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">{label}</p>
          <span className={`h-2 w-2 ${accent}`} />
        </div>
        <div>
          <p className="text-3xl font-semibold tracking-tight text-zinc-100">{value}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-zinc-600">{detail}</p>
        </div>
      </div>
    </article>
  );
}

function PanelTitle({ eyebrow, title, aside }: { eyebrow: string; title: string; aside?: string }) {
  return (
    <div className="flex h-12 flex-none items-start justify-between border-b border-zinc-800 px-4 pt-3">
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-600">{eyebrow}</p>
        <h2 className="mt-0.5 text-sm font-semibold text-zinc-200">{title}</h2>
      </div>
      {aside && <span className="font-mono text-[10px] text-zinc-600">{aside}</span>}
    </div>
  );
}

export default function AnalyticsPage() {
  const presenceErrors = analytics.checks.all_items_present.fail;
  const quantityErrors = analytics.checks.quantities_correct.fail;

  return (
    <main className="grid h-screen overflow-hidden grid-rows-[64px_minmax(0,1fr)] bg-zinc-950 text-zinc-100">
      <header className="flex h-16 items-center justify-between border-b border-zinc-800 px-6">
        <div className="flex items-center gap-3">
          <Logo size={30} />
          <div>
            <p className="text-sm font-semibold tracking-tight">PACK MANAGER / ANALYTICS</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-600">Operations intelligence · daily brief</p>
          </div>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          <DashboardNav active="analytics" />
          <span>{analytics.organization_id}</span>
        </div>
      </header>

      <div className="min-h-0 overflow-y-auto px-5 py-5 lg:px-7">
        <div className="mx-auto grid max-w-[1600px] gap-4">
          <div className="flex h-8 items-center justify-between">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-500">Daily control room</span>
              <span className="ml-3 font-mono text-[10px] text-zinc-600">{analytics.date} / UTC</span>
            </div>
            <span className="border border-zinc-800 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-zinc-500">Last 24 hours</span>
          </div>

          <section className="flex min-h-[72px] items-center justify-between gap-4 border border-emerald-500/35 bg-emerald-500/5 px-4 py-3" aria-label="Evaluation results">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-400">Evaluation Run 2 Results (Verified)</span>
                <span className="font-mono text-[10px] text-zinc-500">{evaluationRun.id} · {evaluationRun.fixtures} fixtures</span>
              </div>
              <p className="mt-1 truncate text-xs text-zinc-400">{evaluationRun.evaluated} evaluated · {evaluationRun.accuracy} accuracy · kappa {evaluationRun.kappa} · {evaluationRun.note}</p>
            </div>
            <Link className="shrink-0 border border-zinc-700 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-zinc-300 transition hover:border-emerald-500 hover:text-emerald-400" href="/analytics?scope=future-products">
              Future products -&gt;
            </Link>
          </section>

          <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Key performance indicators">
            <MetricCard accent="bg-emerald-500" detail="33 mis-ships caught in test set" label="Protected Mis-Ships Value" value="$1,815" />
            <MetricCard accent="bg-sky-400" detail="Run 2 benchmark latency" label="Average Inference Latency (ms)" value="1,845 ms" />
            <MetricCard accent="bg-amber-500" detail="8 / 50 severe occlusion routed" label="Global UNCERTAIN Rate (%)" value="16.0%" />
            <MetricCard accent="bg-zinc-400" detail="held-out test fixtures" label="Total Units Verified" value="50" />
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.65fr]" aria-label="Operator telemetry">
            <article className="h-64 overflow-hidden border border-zinc-800 bg-zinc-900/50">
              <PanelTitle aside="3 evaluators" eyebrow="Operator telemetry" title="Manual Overrides per Operator" />
              <div className="h-[calc(100%-3rem)] px-3 pb-3 pt-2">
                <ResponsiveContainer height="100%" width="100%">
                  <BarChart data={analytics.manual_overrides_by_operator} layout="vertical" margin={{ left: 8, right: 12, top: 2, bottom: 2 }}>
                    <CartesianGrid horizontal={false} stroke="#27272a" />
                    <XAxis axisLine={false} tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} type="number" />
                    <YAxis axisLine={false} dataKey="operator_id" tick={{ fill: "#a1a1aa", fontSize: 10 }} tickLine={false} type="category" width={85} />
                    <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", color: "#f4f4f5", fontSize: 11 }} cursor={{ fill: "#27272a" }} />
                    <Bar dataKey="overrides" fill="#f59e0b" maxBarSize={18} radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="h-64 overflow-hidden border border-zinc-800 bg-zinc-900/50">
              <PanelTitle aside="caught / eligible" eyebrow="Operator telemetry" title="Error-Catch Rate" />
              <div className="h-[calc(100%-3rem)] overflow-y-auto px-4 py-2">
                <table className="w-full table-fixed border-collapse text-left">
                  <thead className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                    <tr><th className="py-2 font-normal">Operator</th><th className="py-2 text-right font-normal">Caught</th><th className="py-2 text-right font-normal">Rate</th></tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80 font-mono text-[11px]">
                    {analytics.operator_error_catch_rate.map((operator) => (
                      <tr key={operator.operator_id}>
                        <td className="py-3 text-zinc-300">{operator.operator_id}</td>
                        <td className="py-3 text-right text-zinc-500">{operator.caught} / {operator.eligible}</td>
                        <td className={`py-3 text-right font-semibold ${operator.rate_percent >= 85 ? "text-emerald-400" : "text-amber-400"}`}>{operator.rate_percent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.85fr_1.15fr]" aria-label="Catalog intelligence">
            <article className="h-64 overflow-hidden border border-zinc-800 bg-zinc-900/50">
              <PanelTitle aside="42 flagged conditions" eyebrow="Catalog intelligence" title="Defect Mix" />
              <div className="grid h-[calc(100%-3rem)] grid-cols-[1fr_1fr] items-center px-4">
                <div className="h-44 min-w-0">
                  <ResponsiveContainer height="100%" width="100%">
                    <PieChart>
                      <Pie data={analytics.defect_types} dataKey="count" cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={3} stroke="#18181b" strokeWidth={2}>
                        {analytics.defect_types.map((entry, index) => <Cell fill={defectColors[index]} key={entry.type} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", color: "#f4f4f5", fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {analytics.defect_types.map((defect, index) => (
                    <div className="flex items-center justify-between gap-2 font-mono text-[10px]" key={defect.type}>
                      <span className="flex min-w-0 items-center gap-2 text-zinc-400"><span className="h-2 w-2 shrink-0" style={{ backgroundColor: defectColors[index] }} /> <span className="truncate">{defect.type}</span></span>
                      <strong className="text-zinc-200">{defect.count}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className="h-64 overflow-hidden border border-zinc-800 bg-zinc-900/50">
              <PanelTitle aside="STOP conditions" eyebrow="Catalog intelligence" title="High-Risk SKUs" />
              <div className="h-[calc(100%-3rem)] overflow-y-auto px-4 py-2">
                <div className="grid grid-cols-[1fr_90px_90px] border-b border-zinc-800 py-2 font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                  <span>SKU</span><span className="text-right">Stops</span><span className="text-right">Seen</span>
                </div>
                {analytics.high_risk_skus.map((sku, index) => (
                  <div className="grid min-h-[42px] grid-cols-[1fr_90px_90px] items-center border-b border-zinc-800/80 font-mono text-[11px]" key={sku.sku}>
                    <span className="flex items-center gap-2 text-zinc-300"><span className={`h-1.5 w-1.5 ${index === 0 ? "bg-red-500" : "bg-amber-500"}`} />{sku.sku}</span>
                    <span className="text-right font-semibold text-red-400">{sku.stop_conditions}</span>
                    <span className="text-right text-zinc-500">{sku.units_seen}</span>
                  </div>
                ))}
                <div className="mt-3 flex items-center justify-between border-l-2 border-red-500/70 bg-red-500/5 px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                  <span>Presence failures <strong className="text-red-400">{presenceErrors}</strong></span>
                  <span>Quantity failures <strong className="text-amber-400">{quantityErrors}</strong></span>
                </div>
              </div>
            </article>
          </section>
        </div>
      </div>
    </main>
  );
}