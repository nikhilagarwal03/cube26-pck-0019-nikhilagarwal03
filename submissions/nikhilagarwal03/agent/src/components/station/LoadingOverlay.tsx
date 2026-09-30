"use client";

import { useEffect, useState } from "react";

const loadingStages = [
  "Extracting SKUs...",
  "Counting items...",
  "Checking occlusion...",
  "Reconciling order...",
];

type LoadingOverlayProps = {
  active: boolean;
};

export function LoadingOverlay({ active }: LoadingOverlayProps) {
  return active ? <ActiveLoadingOverlay /> : null;
}

function ActiveLoadingOverlay() {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStageIndex((current) => (current + 1) % loadingStages.length);
    }, 1_150);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div
      aria-live="polite"
      aria-label="Analyzing package"
      className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-950/82 backdrop-blur-[2px]"
      role="status"
    >
      <div className="w-[min(76%,320px)] border border-emerald-500/45 bg-zinc-950/95 p-5 shadow-[0_18px_70px_rgba(0,0,0,0.45)]">
        <div className="mb-5 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-500">Vision pass</span>
          <span className="flex gap-1" aria-hidden="true">
            <span className="h-1.5 w-1.5 animate-pulse bg-emerald-500" />
            <span className="h-1.5 w-1.5 animate-pulse bg-emerald-500 [animation-delay:180ms]" />
            <span className="h-1.5 w-1.5 animate-pulse bg-emerald-500 [animation-delay:360ms]" />
          </span>
        </div>
        <p className="min-h-6 text-lg font-medium tracking-tight text-zinc-100">{loadingStages[stageIndex]}</p>
        <div className="mt-5 h-1 overflow-hidden bg-zinc-800" aria-hidden="true">
          <div className="h-full w-1/3 animate-[scan_1.5s_ease-in-out_infinite] bg-emerald-500" />
        </div>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">Keep package in frame</p>
      </div>
    </div>
  );
}