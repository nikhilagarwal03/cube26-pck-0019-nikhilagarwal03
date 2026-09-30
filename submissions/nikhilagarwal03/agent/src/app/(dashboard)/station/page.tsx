import { Logo } from "@/components/branding/Logo";
import { CameraFeed } from "@/components/station/CameraFeed";
import { VerdictDisplay } from "@/components/station/VerdictDisplay";

const orderLines = [
  { sku: "SKU-CABLE-USBC", label: "USB-C braided cable", quantity: 1, state: "verified" },
  { sku: "SKU-MUG-11", label: "Stoneware mug / 11 oz", quantity: 2, state: "verified" },
  { sku: "SKU-CANDLE-3", label: "Cedar candle / 3 wick", quantity: 1, state: "checking" },
] as const;

function StatusDot({ state }: { state: "verified" | "checking" }) {
  return (
    <span
      aria-label={state === "verified" ? "Verified" : "Checking"}
      className={`inline-block h-2 w-2 rounded-full ${
        state === "verified" ? "bg-emerald-500" : "animate-pulse bg-amber-500"
      }`}
    />
  );
}

function CameraViewfinder() {
  return (
    <section className="relative min-h-0 overflow-hidden border-r border-zinc-800 bg-[#111214]" aria-label="Camera viewfinder">
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(#2a2d31_1px,transparent_1px),linear-gradient(90deg,#2a2d31_1px,transparent_1px)] [background-size:64px_64px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08),transparent_55%)]" />

      <div className="relative flex h-full min-h-0 flex-col p-7">
        <div className="flex h-8 flex-none items-center justify-between text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-500" /> Live capture</span>
          <span>CAM 01 / 4K</span>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center">
          <div className="absolute left-0 top-1/2 h-8 w-8 -translate-y-1/2 border-l-2 border-t-2 border-emerald-500/80" />
          <div className="absolute right-0 top-1/2 h-8 w-8 -translate-y-1/2 border-r-2 border-t-2 border-emerald-500/80" />
          <div className="absolute bottom-0 left-1/2 h-8 w-8 -translate-x-1/2 border-b-2 border-l-2 border-emerald-500/80" />
          <div className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-emerald-500/80" />
          <div className="relative aspect-[1.35/1] w-[min(86%,820px)] overflow-hidden border border-emerald-500/70 bg-zinc-950/70 shadow-[0_0_0_1px_rgba(16,185,129,0.08),0_24px_80px_rgba(0,0,0,0.35)]">
            <CameraFeed
              verification={{
                unit_id: "UNIT-0034",
                organization_id: "org_demo_alpha",
                order_id: "ORD-DUMMY-50034",
                order_lines: orderLines.map(({ sku, quantity }) => ({ sku, quantity })),
              }}
            />
          </div>
        </div>

        <div className="flex h-12 flex-none items-end justify-between border-t border-zinc-800 pt-3 font-mono text-[10px] text-zinc-500">
          <span>01 OCT 2026 · 14:32:08 UTC</span>
          <span className="text-emerald-500">● SIGNAL LOCKED</span>
        </div>
      </div>
    </section>
  );
}

export default function StationPage() {
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
        <div className="flex items-center gap-5 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          <span>Operator <strong className="font-medium text-zinc-300">OP_AMIRA</strong></span>
          <span className="hidden h-4 w-px bg-zinc-800 sm:block" />
          <span className="hidden sm:inline">Queue <strong className="font-medium text-zinc-300">04</strong></span>
          <span className="h-2 w-2 rounded-full bg-emerald-500" title="Station online" />
        </div>
      </header>

      <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(390px,0.55fr)]">
        <CameraViewfinder />

        <aside className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_260px] overflow-hidden bg-zinc-950">
          <div className="border-b border-zinc-800 px-6 py-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Current order</p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-100">ORD-DUMMY-50034</h1>
              </div>
              <span className="border border-zinc-700 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-zinc-400">Amazon MFN</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              <div><span className="block text-zinc-300">03</span> lines</div>
              <div><span className="block text-zinc-300">04</span> units</div>
              <div><span className="block text-zinc-300">PCK-0034</span> record</div>
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto px-6 py-5">
            <div className="mb-3 flex h-5 items-center justify-between">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Order lines</h2>
              <span className="font-mono text-[10px] text-zinc-600">EXPECTED / FOUND</span>
            </div>
            <div className="space-y-2">
              {orderLines.map((line) => (
                <div className="grid min-h-[72px] grid-cols-[1fr_56px_16px] items-center gap-3 border border-zinc-800 bg-zinc-900/60 px-4" key={line.sku}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-200">{line.label}</p>
                    <p className="mt-1 truncate font-mono text-[10px] tracking-wide text-zinc-500">{line.sku}</p>
                  </div>
                  <div className="text-right font-mono text-sm text-zinc-300"><span className="text-zinc-500">{line.quantity}</span> / {line.state === "verified" ? line.quantity : "—"}</div>
                  <StatusDot state={line.state} />
                </div>
              ))}
            </div>
            <div className="mt-5 border-l-2 border-amber-500/70 bg-amber-500/5 px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-amber-500">Awaiting final read</p>
              <p className="mt-1 text-xs leading-5 text-zinc-400">The candle label is partially occluded. Keep the package open until the final frame resolves.</p>
            </div>
          </div>

          <div className="border-t border-zinc-800 p-5">
            <VerdictDisplay
              decision="UNCERTAIN"
              operatorId="OP_AMIRA"
              organizationId="org_demo_alpha"
              recordId="PCK-0034"
            />
          </div>
        </aside>
      </div>
    </main>
  );
}