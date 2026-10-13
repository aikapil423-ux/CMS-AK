"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Camera,
  X,
  RefreshCw,
  Check,
  RotateCcw,
  Upload,
  UploadCloud,
  AlertCircle,
  FolderOpen,
} from "lucide-react";

/**
 * Helper to inject a captured File into any target <input type="file"> element
 * and trigger React's onChange listener reliably.
 */
function injectFileIntoInputElement(input: HTMLInputElement, file: File) {
  try {
    const dt = new DataTransfer();
    dt.items.add(file);

    // Ensure React's internal _valueTracker detects a change
    const tracker = (input as any)._valueTracker;
    if (tracker && typeof tracker.setValue === "function") {
      tracker.setValue("__camera_capture_pending__");
    }

    try {
      input.files = dt.files;
    } catch {
      Object.defineProperty(input, "files", {
        value: dt.files,
        writable: true,
        configurable: true,
      });
    }

    const changeEvent = new Event("change", { bubbles: true, cancelable: false });
    input.dispatchEvent(changeEvent);
  } catch (err) {
    console.error("Failed to inject captured camera file into input:", err);
  }
}

/**
 * Global Upload & Camera Modal Interceptor
 * Automatically turns every Upload button / file input click across the entire website
 * into a 2-option selector:
 *   1. Camera (Take live photo / scan document)
 *   2. Upload File (Browse file from device)
 */
export function GlobalUploadCameraModal() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"choice" | "camera">("choice");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

  const activeInputRef = useRef<HTMLInputElement | null>(null);
  const nativeClickRef = useRef<((this: HTMLInputElement) => void) | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fallbackCameraInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Intercept all <input type="file"> clicks (both programmatic ref.current.click() and direct/label clicks)
  useEffect(() => {
    if (typeof window === "undefined" || typeof HTMLInputElement === "undefined") {
      return;
    }

    const originalClick = HTMLInputElement.prototype.click;
    nativeClickRef.current = originalClick;

    HTMLInputElement.prototype.click = function (this: HTMLInputElement) {
      if (
        this &&
        this.type === "file" &&
        this.dataset?.bypassCameraInterceptor !== "true"
      ) {
        activeInputRef.current = this;
        setCapturedDataUrl(null);
        setCapturedBlob(null);
        setStreamError(null);
        setMode("choice");
        setIsOpen(true);
        return;
      }
      return originalClick.apply(this, arguments as any);
    };

    const handleGlobalClickCapture = (e: MouseEvent) => {
      const target = e.target;
      if (target instanceof HTMLInputElement && target.type === "file") {
        if (target.dataset?.bypassCameraInterceptor === "true") {
          delete target.dataset.bypassCameraInterceptor;
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        activeInputRef.current = target;
        setCapturedDataUrl(null);
        setCapturedBlob(null);
        setStreamError(null);
        setMode("choice");
        setIsOpen(true);
      }
    };

    window.addEventListener("click", handleGlobalClickCapture, true);

    return () => {
      HTMLInputElement.prototype.click = originalClick;
      window.removeEventListener("click", handleGlobalClickCapture, true);
    };
  }, []);

  const startCameraStream = useCallback(
    async (camMode: "environment" | "user") => {
      stopCameraStream();
      setStreamError(null);
      setIsStartingCamera(true);

      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setStreamError(
          "Live camera API is not available in this browser context. Click 'Device Camera / Photo' below."
        );
        setIsStartingCamera(false);
        return;
      }

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: camMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        streamRef.current = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play().catch(() => {});
        }
      } catch {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            await videoRef.current.play().catch(() => {});
          }
        } catch (innerErr: any) {
          setStreamError(
            innerErr?.message ||
              "Camera permission denied or no camera found. You can use 'Device Camera / Photo' or 'Upload File'."
          );
        }
      } finally {
        setIsStartingCamera(false);
      }
    },
    [stopCameraStream]
  );

  useEffect(() => {
    if (isOpen && mode === "camera" && !capturedDataUrl) {
      startCameraStream(facingMode);
    } else {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen, mode, facingMode, capturedDataUrl, startCameraStream, stopCameraStream]);

  const handleCloseModal = () => {
    stopCameraStream();
    setIsOpen(false);
    setMode("choice");
    setCapturedDataUrl(null);
    setCapturedBlob(null);
    setStreamError(null);
  };

  // Option 2: Standard File Upload from Device
  const handleSelectUploadFromDevice = () => {
    const targetInput = activeInputRef.current;
    handleCloseModal();
    if (!targetInput) return;

    targetInput.dataset.bypassCameraInterceptor = "true";
    if (nativeClickRef.current) {
      nativeClickRef.current.call(targetInput);
    } else {
      targetInput.click();
    }
    setTimeout(() => {
      if (targetInput.dataset) {
        delete targetInput.dataset.bypassCameraInterceptor;
      }
    }, 300);
  };

  // Option 1: Open Live Camera
  const handleSelectCameraOption = () => {
    setCapturedDataUrl(null);
    setCapturedBlob(null);
    setStreamError(null);
    setMode("camera");
  };

  const handleTakeSnapshot = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedDataUrl(dataUrl);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
        }
      },
      "image/jpeg",
      0.92
    );

    stopCameraStream();
  };

  const handleConfirmSnapshot = () => {
    const targetInput = activeInputRef.current;
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const fileName = `Camera_Capture_${timestamp}.jpg`;

    if (capturedBlob && targetInput) {
      const file = new File([capturedBlob], fileName, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
      injectFileIntoInputElement(targetInput, file);
      handleCloseModal();
      return;
    }

    if (capturedDataUrl && targetInput) {
      const byteString = atob(capturedDataUrl.split(",")[1] || "");
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: "image/jpeg" });
      const file = new File([blob], fileName, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
      injectFileIntoInputElement(targetInput, file);
      handleCloseModal();
    }
  };

  const handleFallbackCameraFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetInput = activeInputRef.current;
    if (file && targetInput) {
      injectFileIntoInputElement(targetInput, file);
    }
    if (fallbackCameraInputRef.current) {
      fallbackCameraInputRef.current.value = "";
    }
    handleCloseModal();
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50"
      onClick={handleCloseModal}
    >
      <div
        className={`bg-white border border-slate-200 rounded-2xl shadow-2xl w-full ${
          mode === "choice" ? "max-w-md" : "max-w-lg"
        } overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0b192c] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center">
              {mode === "choice" ? (
                <UploadCloud className="w-4 h-4 text-blue-300" />
              ) : (
                <Camera className="w-4 h-4 text-amber-300" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {mode === "choice"
                  ? "Select Upload Source (अपलोड विकल्प चुनें)"
                  : "Camera Capture & Instant Upload"}
              </h3>
              <p className="text-[11px] text-slate-300">
                {mode === "choice"
                  ? "Choose Camera to capture live photo or Upload from device"
                  : "Capture document or photo directly from camera"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloseModal}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden Fallback Native Camera Input */}
        <input
          ref={fallbackCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          data-bypass-camera-interceptor="true"
          onChange={handleFallbackCameraFile}
          className="hidden"
        />
        <canvas ref={canvasRef} className="hidden" />

        {mode === "choice" ? (
          /* 2-OPTION SELECTOR: CAMERA OR UPLOAD FILE */
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3.5">
              {/* Option 1: Camera */}
              <button
                type="button"
                onClick={handleSelectCameraOption}
                className="group flex flex-col items-center justify-center gap-2.5 p-5 rounded-xl border-2 border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/80 hover:border-indigo-400 transition-all cursor-pointer text-center shadow-2xs"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Camera</p>
                  <p className="text-[11px] font-medium text-slate-600 mt-0.5">
                    कैमरा से फोटो खींचें / स्कैन करें
                  </p>
                </div>
              </button>

              {/* Option 2: Upload File */}
              <button
                type="button"
                onClick={handleSelectUploadFromDevice}
                className="group flex flex-col items-center justify-center gap-2.5 p-5 rounded-xl border-2 border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 hover:border-blue-400 transition-all cursor-pointer text-center shadow-2xs"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#0b192c] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <FolderOpen className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Upload File</p>
                  <p className="text-[11px] font-medium text-slate-600 mt-0.5">
                    डिवाइस से फ़ाइल चुनें (PDF/Doc/Image)
                  </p>
                </div>
              </button>
            </div>

            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* LIVE CAMERA CAPTURE VIEW */
          <div className="p-4 space-y-4">
            <div className="relative w-full aspect-4/3 bg-slate-900 rounded-xl overflow-hidden border border-slate-300 flex items-center justify-center">
              {capturedDataUrl ? (
                <img
                  src={capturedDataUrl}
                  alt="Captured preview"
                  className="w-full h-full object-contain bg-black"
                />
              ) : streamError ? (
                <div className="p-6 text-center space-y-3 max-w-sm">
                  <AlertCircle className="w-9 h-9 text-amber-400 mx-auto" />
                  <p className="text-xs text-slate-200 font-medium leading-relaxed">
                    {streamError}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (fallbackCameraInputRef.current) {
                          fallbackCameraInputRef.current.dataset.bypassCameraInterceptor =
                            "true";
                          nativeClickRef.current?.call(fallbackCameraInputRef.current);
                        }
                      }}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-md"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Device Camera / Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectUploadFromDevice}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs transition-colors cursor-pointer shadow-md"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload File Instead</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {isStartingCamera && (
                    <div className="absolute inset-0 bg-slate-900/70 flex flex-col items-center justify-center gap-2 text-white text-xs font-semibold">
                      <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                      <span>Starting Camera...</span>
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-4 border-2 border-dashed border-white/40 rounded-lg" />
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              {capturedDataUrl ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedDataUrl(null);
                      setCapturedBlob(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retake Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmSnapshot}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>Use Photo &amp; Upload</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMode("choice")}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <span>← Back</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFacingMode((prev) =>
                          prev === "environment" ? "user" : "environment"
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                      title="Switch Front / Back Camera"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Switch Camera</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleTakeSnapshot}
                    disabled={Boolean(streamError) || isStartingCamera}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture Photo</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
