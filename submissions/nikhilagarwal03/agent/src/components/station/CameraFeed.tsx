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
};

type CameraState = "starting" | "ready" | "denied";

export function CameraFeed({ verification, onResult }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraState, setCameraState] = useState<CameraState>("starting");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  function toggleCamera() {
    setCapturedImage(null);
    setCameraError(null);
    setCameraState("starting");
    setFacingMode((current) => (current === "environment" ? "user" : "environment"));
  }

  async function captureFrame() {
    const video = videoRef.current;
    if (!video || cameraState !== "ready" || isProcessing) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(imageDataUrl);

    if (!verification) {
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

      const result = (await response.json()) as unknown;
      if (!response.ok) {
        throw new Error("Pack verification request failed");
      }
      onResult?.(result);
    } catch (error) {
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
      <video
        ref={videoRef}
        autoPlay
        className={`absolute inset-0 h-full w-full object-cover ${capturedImage ? "opacity-25" : ""}`}
        muted
        playsInline
      />
      {capturedImage && (
        <Image
          alt="Captured open package"
          className="absolute inset-0 h-full w-full object-contain"
          fill
          priority
          src={capturedImage}
          unoptimized
        />
      )}
      <div className="pointer-events-none absolute inset-[7%] border border-emerald-500/65" />

      <button
        aria-label={`Switch to ${facingMode === "environment" ? "front" : "back"} camera`}
        className="absolute right-4 top-4 z-10 flex h-12 items-center gap-2 border border-zinc-500 bg-zinc-950/80 px-3 font-mono text-[10px] uppercase tracking-wider text-zinc-200 backdrop-blur transition hover:border-emerald-400 hover:text-emerald-300"
        onClick={toggleCamera}
        title="Switch camera"
        type="button"
      >
        <span className="font-bold leading-none">SWAP</span>
        {facingMode === "environment" ? "Back camera" : "Front camera"}
      </button>

      {cameraState === "starting" && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/90">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Initializing camera</p>
        </div>
      )}
      {cameraState === "denied" && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/95 px-8 text-center">
          <p className="max-w-xs font-mono text-[10px] uppercase leading-5 tracking-[0.16em] text-red-400">{cameraError}</p>
        </div>
      )}

      <button
        className="absolute bottom-6 left-1/2 z-10 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full border-4 border-zinc-950 bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.75)] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-zinc-700"
        disabled={cameraState !== "ready" || isProcessing}
        onClick={() => void captureFrame()}
        title="Capture open package"
        type="button"
      >
        <span className="h-3 w-3 rounded-full bg-zinc-950" />
        <span className="sr-only">Capture open package</span>
      </button>

      <LoadingOverlay active={isProcessing} />
    </div>
  );
}