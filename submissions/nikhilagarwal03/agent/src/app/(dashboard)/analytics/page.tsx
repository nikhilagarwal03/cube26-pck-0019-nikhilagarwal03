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
  protected_revenue_usd: 184260,
  average_inference_latency_ms: 842,
  uncertain_rate_percent: 7.4,
  total_units_verified: 1284,
  checks: {
    all_items_present: { pass: 1178, fail: 73, uncertain: 33 },
    quantities_correct: { pass: 1198, fail: 52, uncertain: 34 },
  },
  manual_overrides_by_operator: [
    { operator_id: "OP_AMIRA", overrides: 18 },
    { operator_id: "OP_BEN", overrides: 12 },
    { operator_id: "OP_CHEN", overrides: 9 },
    { operator_id: "OP_DANA", overrides: 7 },
    { operator_id: "OP_FATIMA", overrides: 5 },
  ],
  operator_error_catch_rate: [
    { operator_id: "OP_AMIRA", caught: 41, eligible: 46, rate_percent: 89.1 },
    { operator_id: "OP_BEN", caught: 34, eligible: 39, rate_percent: 87.2 },
    { operator_id: "OP_CHEN", caught: 29, eligible: 35, rate_percent: 82.9 },
    { operator_id: "OP_DANA", caught: 24, eligible: 31, rate_percent: 77.4 },
  ],
  defect_types: [
    { type: "Missing", count: 38 },
    { type: "Quantity Mismatch", count: 31 },
    { type: "Extra Item", count: 24 },
    { type: "Occluded", count: 33 },
  ],
  high_risk_skus: [
    { sku: "SKU-CANDLE-3", stop_conditions: 19, units_seen: 86 },
    { sku: "SKU-TOWEL-BLU", stop_conditions: 14, units_seen: 112 },
    { sku: "SKU-PUZZLE-500", stop_conditions: 11, units_seen: 94 },
    { sku: "SKU-MUG-11", stop_conditions: 9, units_seen: 138 },
  ],
};

const defectColors = ["#ef4444", "#f59e0b", "#10b981", "#a1a1aa"];

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

          <section className="flex min-h-[72px] items-center justify-between gap-4 border border-amber-500/35 bg-amber-500/5 px-4 py-3" aria-label="Evaluation results">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-500">Evaluation results / demo</span>
                <span className="font-mono text-[10px] text-zinc-500">{evaluationRun.id} · {evaluationRun.fixtures} fixtures</span>
              </div>
              <p className="mt-1 truncate text-xs text-zinc-400">{evaluationRun.evaluated} evaluated · {evaluationRun.accuracy} accuracy · kappa {evaluationRun.kappa} · {evaluationRun.note}</p>
            </div>
            <Link className="shrink-0 border border-zinc-700 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-zinc-300 transition hover:border-emerald-500 hover:text-emerald-400" href="/analytics?scope=future-products">
              Future products -&gt;
            </Link>
          </section>

          <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Key performance indicators">
            <MetricCard accent="bg-emerald-500" detail="orders protected from mis-ship" label="Protected Revenue ($)" value="$184,260" />
            <MetricCard accent="bg-sky-400" detail="p50 request / response" label="Average Inference Latency (ms)" value="842 ms" />
            <MetricCard accent="bg-amber-500" detail="evidence sent to review" label="Global UNCERTAIN Rate (%)" value="7.4%" />
            <MetricCard accent="bg-zinc-400" detail="across merchant + 3PL" label="Total Units Verified" value="1,284" />
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.65fr]" aria-label="Operator telemetry">
            <article className="h-64 overflow-hidden border border-zinc-800 bg-zinc-900/50">
              <PanelTitle aside="5 operators" eyebrow="Operator telemetry" title="Manual Overrides per Operator" />
              <div className="h-[calc(100%-3rem)] px-3 pb-3 pt-2">
                <ResponsiveContainer height="100%" width="100%">
                  <BarChart data={analytics.manual_overrides_by_operator} layout="vertical" margin={{ left: 8, right: 12, top: 2, bottom: 2 }}>
                    <CartesianGrid horizontal={false} stroke="#27272a" />
                    <XAxis axisLine={false} tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} type="number" />
                    <YAxis axisLine={false} dataKey="operator_id" tick={{ fill: "#a1a1aa", fontSize: 10 }} tickLine={false} type="category" width={72} />
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
              <PanelTitle aside="126 total defects" eyebrow="Catalog intelligence" title="Defect Mix" />
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