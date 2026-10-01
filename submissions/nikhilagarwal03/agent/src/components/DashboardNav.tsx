import Link from "next/link";

type DashboardRoute = "station" | "analytics";

type DashboardNavProps = {
  active: DashboardRoute;
};

export function DashboardNav({ active }: DashboardNavProps) {
  return (
    <nav aria-label="Dashboard navigation" className="flex items-center gap-1 border border-zinc-800 p-1 font-mono text-[9px] uppercase tracking-wider">
      <Link
        className={`px-2 py-1.5 transition ${active === "station" ? "bg-emerald-500 text-zinc-950" : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"}`}
        href="/station"
      >
        Station
      </Link>
      <Link
        className={`px-2 py-1.5 transition ${active === "analytics" ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"}`}
        href="/analytics"
      >
        Analytics
      </Link>
      <span className="mx-1 h-4 w-px bg-zinc-800" />
      <Link
        aria-label="Open terminal setup"
        className="flex items-center gap-1.5 px-2 py-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
        href="/setup"
        title="Open terminal setup"
      >
        <span className="h-1.5 w-1.5 bg-emerald-500" />
        Setup
      </Link>
    </nav>
  );
}