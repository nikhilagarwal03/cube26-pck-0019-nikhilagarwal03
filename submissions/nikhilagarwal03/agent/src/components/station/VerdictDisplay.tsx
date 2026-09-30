"use client";

import { useState } from "react";

type Verdict = "SEAL" | "STOP_AND_FIX" | "UNCERTAIN";

const reasonChips = [
  "AI Miscounted",
  "Item Hidden",
  "Wrong SKU",
  "Camera Issue",
] as const;

type VerdictDisplayProps = {
  decision: Verdict;
  recordId: string;
  organizationId: string;
  operatorId: string;
};

const verdictStyles: Record<Verdict, { border: string; text: string; label: string }> = {
  SEAL: {
    border: "border-emerald-500/60 bg-emerald-500/10",
    text: "text-emerald-400",
    label: "SEAL",
  },
  STOP_AND_FIX: {
    border: "border-red-500/60 bg-red-500/10",
    text: "text-red-400",
    label: "STOP & FIX",
  },
  UNCERTAIN: {
    border: "border-amber-500/60 bg-amber-500/10",
    text: "text-amber-400",
    label: "UNCERTAIN",
  },
};

export function VerdictDisplay({
  decision,
  recordId,
  organizationId,
  operatorId,
}: VerdictDisplayProps) {
  const [newDecision, setNewDecision] = useState<"SEAL" | "STOP_AND_FIX" | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const style = verdictStyles[decision];
  const requiresOverride = decision === "STOP_AND_FIX" || decision === "UNCERTAIN";

  async function saveOverride() {
    if (!newDecision || !reason || isSaving) {
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/pack/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization_id: organizationId,
          record_id: recordId,
          new_decision: newDecision,
          reason,
          overridden_by: operatorId,
        }),
      });

      if (!response.ok) {
        throw new Error("Override could not be saved");
      }
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Override could not be saved");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={`h-full overflow-y-auto border p-4 ${style.border}`}>
      <div className="flex min-h-[88px] items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">System verdict</p>
          <p className={`mt-1 text-5xl font-black leading-none tracking-[-0.04em] ${style.text}`}>{style.label}</p>
        </div>
        <div className={`h-5 w-5 shrink-0 rounded-full ${style.text.replace("text-", "bg-")}`} aria-hidden="true" />
      </div>

      {requiresOverride && !saved && (
        <div className="mt-3 border-t border-zinc-700/70 pt-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">Manual override</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(["SEAL", "STOP_AND_FIX"] as const).map((option) => (
              <button
                className={`h-16 border px-2 font-mono text-[11px] font-semibold tracking-wider transition ${
                  newDecision === option
                    ? option === "SEAL"
                      ? "border-emerald-400 bg-emerald-500 text-zinc-950"
                      : "border-red-400 bg-red-500 text-zinc-950"
                    : "border-zinc-700 bg-zinc-950/40 text-zinc-300 hover:border-zinc-400"
                }`}
                key={option}
                onClick={() => setNewDecision(option)}
                type="button"
              >
                {option === "STOP_AND_FIX" ? "STOP & FIX" : option}
              </button>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {reasonChips.map((chip) => (
              <button
                className={`h-16 border px-2 text-left text-[11px] font-medium transition ${
                  reason === chip
                    ? "border-amber-400 bg-amber-500/20 text-amber-300"
                    : "border-zinc-700 bg-zinc-950/30 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                }`}
                key={chip}
                onClick={() => setReason(chip)}
                type="button"
              >
                {chip}
              </button>
            ))}
          </div>
          <button
            className="mt-2 h-16 w-full border border-zinc-500 bg-zinc-100 font-mono text-[11px] font-bold tracking-wider text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:border-zinc-800 disabled:bg-zinc-800 disabled:text-zinc-500"
            disabled={!newDecision || !reason || isSaving}
            onClick={() => void saveOverride()}
            type="button"
          >
            {isSaving ? "SAVING OVERRIDE..." : "RECORD OVERRIDE"}
          </button>
          {error && <p className="mt-2 font-mono text-[10px] text-red-400">{error}</p>}
        </div>
      )}

      {saved && (
        <div className="mt-3 border-t border-emerald-500/30 pt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-400">
          Override recorded · audit trail updated
        </div>
      )}
    </div>
  );
}