"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Logo } from "@/components/branding/Logo";

export default function SetupPage() {
  const router = useRouter();
  const [organizationId, setOrganizationId] = useState("");
  const [stationId, setStationId] = useState("");
  const [error, setError] = useState<string | null>(null);

  function bindDevice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const organization = organizationId.trim();
    const station = stationId.trim();

    if (!organization || !station) {
      setError("Both organization and station identifiers are required.");
      return;
    }

    window.localStorage.setItem("organization_id", organization);
    window.localStorage.setItem("station_id", station);
    router.replace("/");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-6 py-16 text-zinc-50">
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(#27272a_1px,transparent_1px),linear-gradient(90deg,#27272a_1px,transparent_1px)] [background-size:72px_72px]" />
      <section className="relative z-10 w-full max-w-lg border border-zinc-800 bg-zinc-900/90 p-7 shadow-2xl sm:p-9">
        <header className="mb-8 flex items-center gap-4 border-b border-zinc-800 pb-6">
          <Logo size={42} />
          <div>
            <p className="font-mono text-sm font-semibold tracking-[0.18em]">DEVICE BINDING</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">Pack Manager / Terminal setup</p>
          </div>
        </header>

        <div className="mb-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-500">Initialize station context</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100">Bind this device to a warehouse.</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">These identifiers stay on this terminal and are used to associate pack evidence with the correct operation.</p>
        </div>

        <form className="space-y-5" onSubmit={bindDevice}>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">Organization ID</span>
            <input
              autoComplete="organization"
              className="mt-2 h-14 w-full border border-zinc-700 bg-zinc-950 px-4 font-mono text-sm text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-emerald-500"
              onChange={(event) => setOrganizationId(event.target.value)}
              placeholder="org_demo_alpha"
              value={organizationId}
            />
          </label>

          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">Station ID</span>
            <input
              autoComplete="off"
              className="mt-2 h-14 w-full border border-zinc-700 bg-zinc-950 px-4 font-mono text-sm text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-emerald-500"
              onChange={(event) => setStationId(event.target.value)}
              placeholder="station_01"
              value={stationId}
            />
          </label>

          {error && <p className="font-mono text-xs text-red-400">{error}</p>}

          <button className="h-16 w-full border border-emerald-500 bg-emerald-500 font-mono text-xs font-bold tracking-[0.16em] text-zinc-950 transition hover:bg-emerald-400" type="submit">
            SAVE &amp; ENTER TERMINAL
          </button>
        </form>
      </section>
      <p className="absolute bottom-6 left-0 right-0 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600">Local device configuration · no credentials stored</p>
    </main>
  );
}