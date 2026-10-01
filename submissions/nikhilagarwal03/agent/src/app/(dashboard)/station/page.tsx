"use client";

import { useState } from "react";
import { Logo } from "@/components/branding/Logo";
import { DashboardNav } from "@/components/DashboardNav";
import { CameraFeed } from "@/components/station/CameraFeed";
import { VerdictDisplay } from "@/components/station/VerdictDisplay";

type LineState = "verified" | "checking" | "failed";

type OrderLine = {
  sku: string;
  label: string;
  quantity: number;
  state: LineState;
};

// Configured for Fixture 1.a (Batch 1: Bath Control · Perfect Pack · SEAL)
const initialOrderLines: OrderLine[] = [
  { sku: "SKU-BATH-TOWEL-LIGHT-BLUE", label: "Plush bath towel / Light blue", quantity: 2, state: "verified" },
  { sku: "SKU-BATH-SOAP-LAVENDER", label: "Organic lavender soap bar", quantity: 1, state: "verified" },
];

function StatusDot({ state }: { state: LineState }) {
  if (state === "verified") {
    return (
      <span
        aria-label="Verified"
        className="inline-block h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
      />
    );
  }
  if (state === "failed") {
    return (
      <span
        aria-label="Failed"
        className="inline-block h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
      />
    );
  }
  return (
    <span
      aria-label="Checking"
      className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
    />
  );
}

function CameraViewfinder({
  activeVerdict,
  isOverridden,
  notice,
  orderLines,
  onResult,
}: {
  activeVerdict: "SEAL" | "STOP_AND_FIX" | "UNCERTAIN";
  isOverridden: boolean;
  notice: string | null;
  orderLines: OrderLine[];
  onResult: (result: unknown) => void;
}) {
  const reticleColor =
    isOverridden || activeVerdict === "SEAL"
      ? "border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
      : activeVerdict === "UNCERTAIN"
        ? "border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
        : "border-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.4)]";

  const ambientRadial =
    isOverridden || activeVerdict === "SEAL"
      ? "bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12),transparent_55%)]"
      : activeVerdict === "UNCERTAIN"
        ? "bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.12),transparent_55%)]"
        : "bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.12),transparent_55%)]";

  return (
    <section className="relative min-h-0 overflow-hidden border-r border-zinc-800 bg-[#111214]" aria-label="Camera viewfinder">
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(#2a2d31_1px,transparent_1px),linear-gradient(90deg,#2a2d31_1px,transparent_1px)] [background-size:64px_64px]" />
      <div className={`absolute inset-0 transition-colors duration-500 ${ambientRadial}`} />

      <div className="relative flex h-full min-h-0 flex-col p-7">
        <div className="flex h-8 flex-none items-center justify-between text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live capture · Batch 1.a
          </span>
          <span>CAM 01 / 4K</span>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center">
          <div className={`absolute left-0 top-1/2 h-8 w-8 -translate-y-1/2 border-l-2 border-t-2 transition-all duration-300 ${reticleColor}`} />
          <div className={`absolute right-0 top-1/2 h-8 w-8 -translate-y-1/2 border-r-2 border-t-2 transition-all duration-300 ${reticleColor}`} />
          <div className={`absolute bottom-0 left-1/2 h-8 w-8 -translate-x-1/2 border-b-2 border-l-2 transition-all duration-300 ${reticleColor}`} />
          <div className={`absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 transition-all duration-300 ${reticleColor}`} />
          
          <div className="relative aspect-[1.35/1] w-[min(86%,820px)] overflow-hidden border border-zinc-800 bg-zinc-950/70 shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
            <CameraFeed
              activeVerdict={activeVerdict}
              isOverridden={isOverridden}
              onResult={onResult}
              verdictNotice={notice}
              verification={{
                unit_id: "UNIT-0001",
                organization_id: "org_demo_alpha",
                station_id: "station_01",
                order_id: "ORD-MFN-1001A",
                order_lines: orderLines.map(({ sku, quantity }) => ({ sku, quantity })),
              }}
            />
          </div>
        </div>

        <div className="flex h-12 flex-none items-end justify-between border-t border-zinc-800 pt-3 font-mono text-[10px] text-zinc-500">
          <span>01 OCT 2026 · 14:32:08 UTC</span>
          <span className={isOverridden || activeVerdict === "SEAL" ? "text-emerald-500" : activeVerdict === "UNCERTAIN" ? "text-amber-500" : "text-red-500"}>
            ● SIGNAL LOCKED · INFERENCE READY (FIXTURE 1.a)
          </span>
        </div>
      </div>
    </section>
  );
}

export default function StationPage() {
  const [activeVerdict, setActiveVerdict] = useState<"SEAL" | "STOP_AND_FIX" | "UNCERTAIN">("SEAL");
  const [isOverridden, setIsOverridden] = useState(false);
  const [orderLines, setOrderLines] = useState<OrderLine[]>(initialOrderLines);
  const [verdictNotice, setVerdictNotice] = useState<string | null>(
    "All 3 items verified cleanly. Pack conforms to manifest. Ready for flaps close."
  );

  function handleVerificationResult(result: unknown) {
    const res = result as {
      reconciliation?: { verdict: "SEAL" | "STOP_AND_FIX" | "UNCERTAIN" };
      PENDING_REVIEW?: boolean;
    };
    const verdict = res?.reconciliation?.verdict || (res?.PENDING_REVIEW ? "UNCERTAIN" : "SEAL");
    setActiveVerdict(verdict);
    setIsOverridden(false);

    if (verdict === "SEAL") {
      setOrderLines((lines) => lines.map((l) => ({ ...l, state: "verified" })));
      setVerdictNotice("All 3 items verified cleanly. Pack conforms to manifest. Ready for flaps close.");
    } else if (verdict === "UNCERTAIN") {
      setOrderLines((lines) =>
        lines.map((l) => (l.sku === "SKU-BATH-SOAP-LAVENDER" ? { ...l, state: "checking" } : l)),
      );
      setVerdictNotice("Lavender soap packaging is partially occluded. Verify presence before seal.");
    } else {
      setOrderLines((lines) =>
        lines.map((l) => (l.sku === "SKU-BATH-SOAP-LAVENDER" ? { ...l, state: "failed" } : l)),
      );
      setVerdictNotice("Carton discrepancy detected. Do not seal carton.");
    }
  }

  function handleOverrideSuccess(newDecision: "SEAL" | "STOP_AND_FIX", reason: string) {
    setActiveVerdict(newDecision);
    setIsOverridden(true);
    if (newDecision === "SEAL") {
      setOrderLines((lines) => lines.map((l) => ({ ...l, state: "verified" })));
      setVerdictNotice(`Operator OP_AMIRA verified items present (${reason}). SEAL authorized.`);
    } else {
      setOrderLines((lines) =>
        lines.map((l) => (l.sku === "SKU-BATH-SOAP-LAVENDER" ? { ...l, state: "failed" } : l)),
      );
      setVerdictNotice(`Operator marked carton STOP & FIX (${reason}). Divert to rework.`);
    }
  }

  return (
    <main className="grid h-screen overflow-hidden grid-rows-[64px_minmax(0,1fr)] bg-zinc-950 text-zinc-100">
      <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6">
        <div className="flex items-center gap-3">
          <Logo size={30} />
          <div>
            <p className="text-sm font-semibold tracking-tight text-zinc-100">PACK MANAGER</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">Outbound verification / station 03</p>
          </div>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          <DashboardNav active="station" />
          <div className="hidden items-center gap-5 sm:flex">
            <span>Operator <strong className="font-medium text-zinc-300">OP_AMIRA</strong></span>
            <span className="h-4 w-px bg-zinc-800" />
            <span>Queue <strong className="font-medium text-zinc-300">04</strong></span>
          </div>
        </div>
      </header>

      <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(390px,0.55fr)]">
        <CameraViewfinder
          activeVerdict={activeVerdict}
          isOverridden={isOverridden}
          notice={verdictNotice}
          onResult={handleVerificationResult}
          orderLines={orderLines}
        />

        <aside className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_260px] overflow-hidden bg-zinc-950">
          <div className="border-b border-zinc-800 px-6 py-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Current order</p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-100">ORD-MFN-1001A</h1>
              </div>
              <span className="border border-emerald-500/50 bg-emerald-500/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-emerald-400">
                Batch 1.a · MFN
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              <div><span className="block text-zinc-300">02</span> lines</div>
              <div><span className="block text-zinc-300">03</span> units</div>
              <div><span className="block text-zinc-300">PCK-0001</span> record</div>
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto px-6 py-5">
            <div className="mb-3 flex h-5 items-center justify-between">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Order lines</h2>
              <span className="font-mono text-[10px] text-zinc-600">EXPECTED / FOUND</span>
            </div>
            <div className="space-y-2">
              {orderLines.map((line) => (
                <div className="grid min-h-[72px] grid-cols-[1fr_56px_16px] items-center gap-3 border border-zinc-800 bg-zinc-900/60 px-4 transition-colors" key={line.sku}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-200">{line.label}</p>
                    <p className="mt-1 truncate font-mono text-[10px] tracking-wide text-zinc-500">{line.sku}</p>
                  </div>
                  <div className="text-right font-mono text-sm text-zinc-300">
                    <span className="text-zinc-500">{line.quantity}</span> / {line.state === "verified" ? line.quantity : "—"}
                  </div>
                  <StatusDot state={line.state} />
                </div>
              ))}
            </div>

            {activeVerdict === "UNCERTAIN" && !isOverridden && (
              <div className="mt-5 border-l-2 border-amber-500/70 bg-amber-500/5 px-4 py-3 transition-all">
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-amber-500">Awaiting final read</p>
                <p className="mt-1 text-xs leading-5 text-zinc-400">{verdictNotice}</p>
              </div>
            )}

            {(activeVerdict === "SEAL" || isOverridden) && (
              <div className="mt-5 border-l-2 border-emerald-500/70 bg-emerald-500/5 px-4 py-3 transition-all">
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-emerald-400">Ready for sealing</p>
                <p className="mt-1 text-xs leading-5 text-zinc-300">{verdictNotice}</p>
              </div>
            )}

            {activeVerdict === "STOP_AND_FIX" && !isOverridden && (
              <div className="mt-5 border-l-2 border-red-500/70 bg-red-500/5 px-4 py-3 transition-all">
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-red-400">Do not seal carton</p>
                <p className="mt-1 text-xs leading-5 text-zinc-300">{verdictNotice}</p>
              </div>
            )}
          </div>

          <div className="border-t border-zinc-800 p-5">
            <VerdictDisplay
              decision={activeVerdict}
              onOverrideSuccess={handleOverrideSuccess}
              operatorId="OP_AMIRA"
              organizationId="org_demo_alpha"
              recordId="PCK-0001"
            />
          </div>
        </aside>
      </div>
    </main>
  );
}