"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { LoadingOverlay } from "./LoadingOverlay";

type VerificationContext = {
  unit_id: string;
  organization_id: string;
  station_id: string;
  order_id: string;
  order_lines: Array<{ sku: string; quantity: number }>;
};

type CameraFeedProps = {
  verification?: VerificationContext;
  onResult?: (result: unknown) => void;
  activeVerdict?: "SEAL" | "STOP_AND_FIX" | "UNCERTAIN" | null;
  verdictNotice?: string | null;
  isOverridden?: boolean;
};

type CameraState = "starting" | "ready" | "denied";

const glowStyles: Record<
  "SEAL" | "STOP_AND_FIX" | "UNCERTAIN",
  {
    glowBorder: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    pillBg: string;
    pillText: string;
    title: string;
    subtitle: string;
    icon: string;
  }
> = {
  SEAL: {
    glowBorder: "border-4 border-emerald-400 shadow-[inset_0_0_60px_rgba(16,185,129,0.35),0_0_40px_rgba(16,185,129,0.5)]",
    badgeBg: "bg-zinc-950/90",
    badgeBorder: "border-2 border-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.45)]",
    badgeText: "text-emerald-400",
    pillBg: "bg-emerald-500/20 border-emerald-500/50",
    pillText: "text-emerald-300",
    title: "READY TO SEAL",
    subtitle: "ALL SKUs RECONCILED · CLEAR FOR DISPATCH",
    icon: "✓",
  },
  UNCERTAIN: {
    glowBorder: "border-4 border-amber-400 shadow-[inset_0_0_60px_rgba(245,158,11,0.35),0_0_40px_rgba(245,158,11,0.5)]",
    badgeBg: "bg-zinc-950/90",
    badgeBorder: "border-2 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.45)]",
    badgeText: "text-amber-400",
    pillBg: "bg-amber-500/20 border-amber-500/50",
    pillText: "text-amber-300",
    title: "UNCERTAIN",
    subtitle: "OCCLUSION FLAGGED · OPERATOR CHECK REQUIRED",
    icon: "⚠",
  },
  STOP_AND_FIX: {
    glowBorder: "border-4 border-red-500 shadow-[inset_0_0_60px_rgba(239,68,68,0.4),0_0_50px_rgba(239,68,68,0.6)]",
    badgeBg: "bg-zinc-950/90",
    badgeBorder: "border-2 border-red-500 shadow-[0_0_35px_rgba(239,68,68,0.55)]",
    badgeText: "text-red-400",
    pillBg: "bg-red-500/20 border-red-500/50",
    pillText: "text-red-300",
    title: "STOP & FIX",
    subtitle: "QUANTITY MISMATCH · REMOVE BOX FROM BELT",
    icon: "⛔",
  },
};

export function CameraFeed({
  verification,
  onResult,
  activeVerdict,
  verdictNotice,
  isOverridden = false,
}: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraState, setCameraState] = useState<CameraState>("starting");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [stationMode, setStationMode] = useState<"live" | "demo">("live");
  const [demoImage, setDemoImage] = useState<string | null>(null);
  const [liveCapturedSnap, setLiveCapturedSnap] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [localVerdict, setLocalVerdict] = useState<"SEAL" | "STOP_AND_FIX" | "UNCERTAIN" | null>(null);
  const [showVerdictStamp, setShowVerdictStamp] = useState(false);

  const currentVerdict = activeVerdict !== undefined ? activeVerdict : localVerdict;
  const currentGlow = currentVerdict ? glowStyles[currentVerdict] : null;

  const [prevIsOverridden, setPrevIsOverridden] = useState(isOverridden);
  if (isOverridden !== prevIsOverridden) {
    setPrevIsOverridden(isOverridden);
    if (isOverridden) {
      setShowVerdictStamp(true);
    }
  }

  useEffect(() => {
    let stream: MediaStream | undefined;
    let isMounted = true;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraState("denied");
        setCameraError("Camera access is unavailable in this browser.");
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: facingMode },
            height: { ideal: 2160 },
            width: { ideal: 3840 },
          },
        });

        if (!isMounted || !videoRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        videoRef.current.srcObject = stream;
        setCameraState("ready");
      } catch {
        setCameraState("denied");
        setCameraError("Camera permission is required for a pack capture.");
      }
    }

    void startCamera();

    return () => {
      isMounted = false;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [facingMode]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setDemoImage(dataUrl);
      setStationMode("demo");
      setShowVerdictStamp(false);
    };
    reader.readAsDataURL(file);
  }

  function loadSampleFixture1a() {
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 750;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Cardboard Box Background
    ctx.fillStyle = "#8d6447";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Box inner shadow / flaps
    ctx.fillStyle = "#704d33";
    ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
    ctx.fillStyle = "#80583b";
    ctx.fillRect(40, 40, canvas.width - 80, canvas.height - 80);

    // Towel 1 (Light Blue - Left)
    ctx.fillStyle = "#7bb4db";
    ctx.beginPath();
    ctx.roundRect(70, 70, 400, 360, 16);
    ctx.fill();
    ctx.strokeStyle = "#5a9bc7";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Towel 1 Label / Fold texture
    ctx.fillStyle = "#6ca7d1";
    ctx.fillRect(90, 220, 360, 8);
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 18px monospace";
    ctx.fillText("SKU-BATH-TOWEL-LIGHT-BLUE", 95, 120);
    ctx.font = "14px sans-serif";
    ctx.fillStyle = "#0f172a";
    ctx.fillText("Plush Bath Towel (1 of 2)", 95, 150);

    // Towel 2 (Light Blue - Right)
    ctx.fillStyle = "#7bb4db";
    ctx.beginPath();
    ctx.roundRect(530, 70, 400, 360, 16);
    ctx.fill();
    ctx.strokeStyle = "#5a9bc7";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Towel 2 Label / Fold texture
    ctx.fillStyle = "#6ca7d1";
    ctx.fillRect(550, 220, 360, 8);
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 18px monospace";
    ctx.fillText("SKU-BATH-TOWEL-LIGHT-BLUE", 555, 120);
    ctx.font = "14px sans-serif";
    ctx.fillStyle = "#0f172a";
    ctx.fillText("Plush Bath Towel (2 of 2)", 555, 150);

    // Lavender Soap (Purple packaging - Center Bottom)
    ctx.fillStyle = "#8b5cf6";
    ctx.beginPath();
    ctx.roundRect(340, 480, 320, 180, 12);
    ctx.fill();
    ctx.strokeStyle = "#6d28d9";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px monospace";
    ctx.fillText("SKU-BATH-SOAP-LAVENDER", 365, 540);
    ctx.font = "16px sans-serif";
    ctx.fillText("Organic Lavender Bar Soap", 365, 575);
    ctx.font = "italic 13px sans-serif";
    ctx.fillStyle = "#e9d5ff";
    ctx.fillText("Net Wt. 100g · Pure Essential Oils", 365, 605);

    // Header stamp
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(40, 40, canvas.width - 80, 36);
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 14px monospace";
    ctx.fillText("FIXTURE 1.a · BATCH 1 CONTROL (PERFECT PACK · SEAL EXPECTED)", 60, 64);

    const sampleUrl = canvas.toDataURL("image/jpeg", 0.95);
    setDemoImage(sampleUrl);
    setStationMode("demo");
    setShowVerdictStamp(false);
  }

  function toggleCamera() {
    setLiveCapturedSnap(null);
    setCameraError(null);
    setCameraState("starting");
    setFacingMode((current) => (current === "environment" ? "user" : "environment"));
  }

  async function captureFrame() {
    if (isProcessing) {
      return;
    }

    let imageDataUrl: string | null = null;

    if (stationMode === "demo") {
      if (!demoImage) {
        loadSampleFixture1a();
        return;
      }
      imageDataUrl = demoImage;
    } else {
      const video = videoRef.current;
      if (!video || cameraState !== "ready") {
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setLiveCapturedSnap(imageDataUrl);
    }

    if (!verification || !imageDataUrl) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch("/api/pack/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...verification,
          image_url: imageDataUrl,
          images: [imageDataUrl],
        }),
      });

      const result = (await response.json()) as {
        reconciliation?: { verdict: "SEAL" | "STOP_AND_FIX" | "UNCERTAIN" };
        PENDING_REVIEW?: boolean;
      };
      if (!response.ok) {
        throw new Error("Pack verification request failed");
      }
      const verdict = result?.reconciliation?.verdict || (result?.PENDING_REVIEW ? "UNCERTAIN" : "SEAL");
      setLocalVerdict(verdict);
      setShowVerdictStamp(true);
      onResult?.(result);
    } catch (error) {
      setLocalVerdict("UNCERTAIN");
      setShowVerdictStamp(true);
      onResult?.({
        PENDING_REVIEW: true,
        error: error instanceof Error ? error.message : "Pack verification failed",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-zinc-950">
      {/* Live Webcam Stream */}
      <video
        autoPlay
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${
          stationMode === "demo" ? "hidden" : liveCapturedSnap ? "opacity-30" : "opacity-100"
        }`}
        muted
        playsInline
        ref={videoRef}
      />

      {/* Snapshot frozen overlay in Live mode (after capture) */}
      {stationMode === "live" && liveCapturedSnap && (
        <Image
          alt="Captured live carton snap"
          className="absolute inset-0 h-full w-full object-contain"
          fill
          priority
          src={liveCapturedSnap}
          unoptimized
        />
      )}

      {/* Demo Picture in Demo mode */}
      {stationMode === "demo" && demoImage && (
        <Image
          alt="Loaded demo carton picture"
          className="absolute inset-0 h-full w-full object-contain"
          fill
          priority
          src={demoImage}
          unoptimized
        />
      )}

      {/* Demo mode empty placeholder if no picture loaded yet */}
      {stationMode === "demo" && !demoImage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/95 p-6 text-center">
          <p className="font-mono text-xs uppercase tracking-wider text-zinc-400">No Demo Picture Loaded</p>
          <div className="mt-4 flex items-center gap-3">
            <button
              className="border border-emerald-500 bg-emerald-500/10 px-4 py-2 font-mono text-xs uppercase tracking-wider text-emerald-400 hover:bg-emerald-500/20"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              📁 Load 1.a Image File
            </button>
            <button
              className="border border-zinc-700 bg-zinc-900 px-4 py-2 font-mono text-xs uppercase tracking-wider text-zinc-300 hover:border-zinc-500"
              onClick={loadSampleFixture1a}
              type="button"
            >
              📦 Load 1.a Sample
            </button>
          </div>
        </div>
      )}

      {/* Screen Glow Perimeter - only active upon verdict flash */}
      {showVerdictStamp && currentGlow && (
        <div
          className={`pointer-events-none absolute inset-0 z-10 animate-glow-pulse transition-all duration-300 ${currentGlow.glowBorder}`}
        />
      )}

      <div className="pointer-events-none absolute inset-[7%] border border-emerald-500/65" />

      {/* Top Left: LIVE vs DEMO Mode Toggle */}
      <div className="absolute left-4 top-4 z-30 flex items-center rounded-sm border border-zinc-700 bg-zinc-950/90 p-0.5 shadow-lg backdrop-blur">
        <button
          className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition ${
            stationMode === "live"
              ? "border border-emerald-500 bg-emerald-500 font-bold text-zinc-950 shadow"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
          onClick={() => {
            setStationMode("live");
            setLiveCapturedSnap(null);
            setShowVerdictStamp(false);
          }}
          type="button"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${stationMode === "live" ? "bg-zinc-950 animate-pulse" : "bg-emerald-500"}`} />
          Live Camera
        </button>
        <button
          className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition ${
            stationMode === "demo"
              ? "border border-emerald-500 bg-emerald-500 font-bold text-zinc-950 shadow"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
          onClick={() => {
            setStationMode("demo");
            setShowVerdictStamp(false);
            if (!demoImage) {
              loadSampleFixture1a();
            }
          }}
          type="button"
        >
          <span>📦</span>
          Demo Picture
        </button>
      </div>

      {/* Top Center: HUD Latency & Status Pill */}
      {showVerdictStamp && currentGlow && (
        <div className="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2">
          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] backdrop-blur-md transition-all ${currentGlow.pillBg} ${currentGlow.pillText}`}
          >
            <span className="font-bold">{isOverridden ? "OVERRIDE RECORDED" : currentVerdict}</span>
            <span className="text-zinc-500">·</span>
            <span>1,845 MS LATENCY</span>
          </div>
        </div>
      )}

      {/* Central HUD Verdict Stamp */}
      {showVerdictStamp && currentGlow && (
        <div
          className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center p-6"
          key={`hud-stamp-${currentVerdict}-${isOverridden}`}
        >
          <div
            className={`animate-hud-stamp pointer-events-auto relative w-full max-w-md rounded-sm border px-6 py-5 text-center shadow-2xl backdrop-blur-md ${currentGlow.badgeBorder} ${currentGlow.badgeBg}`}
          >
            {/* Small '✕' Close Button */}
            <button
              aria-label="Close verdict message"
              className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded border border-zinc-700 bg-zinc-950/80 font-mono text-xs font-bold text-zinc-400 transition hover:border-zinc-500 hover:bg-zinc-800 hover:text-zinc-100"
              onClick={() => setShowVerdictStamp(false)}
              title="Close message"
              type="button"
            >
              ✕
            </button>

            <div className="mb-2 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-400">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  isOverridden || currentVerdict === "SEAL"
                    ? "bg-emerald-400 animate-ping"
                    : currentVerdict === "UNCERTAIN"
                      ? "bg-amber-400 animate-ping"
                      : "bg-red-400 animate-ping"
                }`}
              />
              <span>{isOverridden ? "OPERATOR OVERRIDE COMMITTED" : "VERDICT EVALUATION COMPLETE"}</span>
            </div>

            <div className="my-1 flex items-center justify-center gap-3">
              <span className={`text-4xl font-black ${currentGlow.badgeText}`}>
                {isOverridden ? "✓" : currentGlow.icon}
              </span>
              <h2 className={`font-mono text-2xl font-black tracking-tight md:text-3xl ${currentGlow.badgeText}`}>
                {isOverridden ? "OVERRIDE RECORDED" : currentGlow.title}
              </h2>
            </div>

            <p className="mt-2 border-t border-zinc-800/80 pt-2 font-mono text-[11px] uppercase tracking-wider text-zinc-300">
              {isOverridden
                ? "SEAL AUTHORIZED · AUDIT HASH SIGNED"
                : (verdictNotice || currentGlow.subtitle)}
            </p>
          </div>
        </div>
      )}

      <input
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
        ref={fileInputRef}
        type="file"
      />

      {/* Top Right: Mode-Specific Controls */}
      <div className="absolute right-4 top-4 z-30 flex items-center gap-2">
        {stationMode === "live" ? (
          <>
            {liveCapturedSnap && (
              <button
                className="flex h-9 items-center gap-1.5 border border-emerald-500/80 bg-zinc-950/85 px-3 font-mono text-[10px] uppercase tracking-wider text-emerald-300 backdrop-blur transition hover:bg-emerald-500/20"
                onClick={() => {
                  setLiveCapturedSnap(null);
                  setShowVerdictStamp(false);
                }}
                title="Unfreeze and resume live camera feed"
                type="button"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Feed
              </button>
            )}
            <button
              aria-label={`Switch to ${facingMode === "environment" ? "front" : "back"} camera`}
              className="flex h-9 items-center gap-1.5 border border-zinc-600 bg-zinc-950/85 px-3 font-mono text-[10px] uppercase tracking-wider text-zinc-300 backdrop-blur transition hover:border-zinc-400"
              onClick={toggleCamera}
              title="Switch between front and back camera"
              type="button"
            >
              Swap Camera
            </button>
          </>
        ) : (
          <>
            <button
              className="flex h-9 items-center gap-1.5 border border-zinc-600 bg-zinc-950/85 px-2.5 font-mono text-[10px] uppercase tracking-wider text-zinc-300 backdrop-blur transition hover:border-emerald-400 hover:text-emerald-300"
              onClick={() => fileInputRef.current?.click()}
              title="Upload your Batch 1.a image file"
              type="button"
            >
              📁 Load 1.a Image
            </button>
            <button
              className="flex h-9 items-center gap-1.5 border border-zinc-600 bg-zinc-950/85 px-2.5 font-mono text-[10px] uppercase tracking-wider text-zinc-300 backdrop-blur transition hover:border-emerald-400 hover:text-emerald-300"
              onClick={loadSampleFixture1a}
              title="Load Fixture 1.a sample carton"
              type="button"
            >
              📦 1.a Sample
            </button>
          </>
        )}
      </div>

      {stationMode === "live" && cameraState === "starting" && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/90">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Initializing camera</p>
        </div>
      )}
      {stationMode === "live" && cameraState === "denied" && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/95 px-8 text-center">
          <p className="max-w-xs font-mono text-[10px] uppercase leading-5 tracking-[0.16em] text-red-400">{cameraError}</p>
        </div>
      )}

      {/* Main Bottom Capture Button */}
      <button
        className="absolute bottom-6 left-1/2 z-30 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full border-4 border-zinc-950 bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.75)] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-zinc-700"
        disabled={isProcessing || (stationMode === "live" && cameraState !== "ready") || (stationMode === "demo" && !demoImage)}
        onClick={() => void captureFrame()}
        title={stationMode === "live" ? "Capture snapshot from live webcam" : "Verify loaded demo carton picture"}
        type="button"
      >
        <span className="h-3 w-3 rounded-full bg-zinc-950" />
        <span className="sr-only">{stationMode === "live" ? "Capture camera frame" : "Verify demo package"}</span>
      </button>

      <LoadingOverlay active={isProcessing} />
    </div>
  );
}