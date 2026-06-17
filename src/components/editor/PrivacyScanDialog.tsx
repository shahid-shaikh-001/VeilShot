"use client";

import {
  Check,
  CheckCircle2,
  Loader2,
  ScanSearch,
  ShieldAlert,
  Square,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { getProtectionPreset } from "@/features/editor/protection-presets";
import {
  PrivacyScanException,
  scanImageForSensitiveData,
} from "@/features/privacy-scan/scan-image";
import { cn } from "@/lib/cn";
import { useEditor } from "@/providers/EditorProvider";

import type {
  PrivacyScanProgress,
  PrivacySuggestion,
} from "@/features/privacy-scan/privacy-scan.types";
import type { Annotation } from "@/types/editor";

interface PrivacyScanDialogProps {
  onClose: () => void;
}

const initialProgress: PrivacyScanProgress = {
  status: "idle",
  message: "Ready to scan the image locally.",
  progress: 0,
};

export function PrivacyScanDialog({ onClose }: PrivacyScanDialogProps) {
  const {
    imageUrl,
    imageBounds,
    protectionMode,
    addAnnotation,
    setActiveTool,
  } = useEditor();

  const abortControllerRef = useRef<AbortController | null>(null);

  const [progress, setProgress] =
    useState<PrivacyScanProgress>(initialProgress);

  const [suggestions, setSuggestions] = useState<PrivacySuggestion[]>([]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isScanning =
    progress.status === "loading" ||
    progress.status === "recognizing" ||
    progress.status === "detecting";

  const selectedSuggestions = useMemo(
    () => suggestions.filter((suggestion) => suggestion.selected),
    [suggestions],
  );

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const startScan = async () => {
    if (!imageUrl || !imageBounds) {
      setErrorMessage("Load an image before starting the privacy scan.");

      return;
    }

    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setErrorMessage(null);
    setSuggestions([]);
    setProgress({
      status: "loading",
      message: "Preparing the local privacy scan…",
      progress: 0,
    });

    try {
      const result = await scanImageForSensitiveData({
        imageUrl,
        imageBounds,
        signal: controller.signal,
        onProgress: setProgress,
      });

      setSuggestions(result.suggestions);

      if (result.suggestions.length === 0) {
        toast.info("No common sensitive-data patterns were detected.");
      }
    } catch (error) {
      if (
        error instanceof PrivacyScanException &&
        error.details.code === "SCAN_CANCELLED"
      ) {
        setProgress({
          status: "idle",
          message: "Privacy scan cancelled.",
          progress: 0,
        });

        return;
      }

      const message =
        error instanceof PrivacyScanException
          ? error.details.message
          : "The privacy scan could not be completed.";

      setErrorMessage(message);

      setProgress({
        status: "error",
        message,
        progress: 0,
      });
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  const cancelScan = () => {
    abortControllerRef.current?.abort();
  };

  const toggleSuggestion = (id: string) => {
    setSuggestions((current) =>
      current.map((suggestion) =>
        suggestion.id === id
          ? {
              ...suggestion,
              selected: !suggestion.selected,
            }
          : suggestion,
      ),
    );
  };

  const selectAll = () => {
    setSuggestions((current) =>
      current.map((suggestion) => ({
        ...suggestion,
        selected: true,
      })),
    );
  };

  const clearSelection = () => {
    setSuggestions((current) =>
      current.map((suggestion) => ({
        ...suggestion,
        selected: false,
      })),
    );
  };

  const applySelectedSuggestions = () => {
    if (!imageBounds || selectedSuggestions.length === 0) {
      return;
    }

    const preset = getProtectionPreset(protectionMode);

    for (const suggestion of selectedSuggestions) {
      const annotation = createAnnotationFromSuggestion({
        suggestion,
        imageWidth: imageBounds.width,
        imageHeight: imageBounds.height,
        preset,
      });

      addAnnotation(annotation);
    }

    setActiveTool("select");

    toast.success(
      `${selectedSuggestions.length} suggested ${
        selectedSuggestions.length === 1 ? "region" : "regions"
      } added.`,
    );

    onClose();
  };

  const handleClose = () => {
    abortControllerRef.current?.abort();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Smart privacy scan"
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isScanning) {
          handleClose();
        }
      }}
    >
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-950 shadow-2xl">
        <header className="flex items-start gap-4 border-b border-neutral-800 px-5 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
            <ScanSearch size={20} aria-hidden="true" />
          </span>

          <div>
            <h2 className="font-semibold text-white">Smart Privacy Scan</h2>

            <p className="mt-1 text-sm text-neutral-500">
              Detect possible sensitive text using local OCR.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isScanning}
            aria-label="Close privacy scan"
            className="ml-auto rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X size={19} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.07] p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert
                size={18}
                className="mt-0.5 shrink-0 text-violet-300"
                aria-hidden="true"
              />

              <div>
                <p className="text-sm font-semibold text-violet-100">
                  Local detection only
                </p>

                <p className="mt-1 text-sm leading-6 text-neutral-400">
                  OCR runs inside your browser. Detected regions are suggestions
                  and should be reviewed before export.
                </p>
              </div>
            </div>
          </div>

          {progress.status === "idle" && suggestions.length === 0 ? (
            <div className="py-12 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 text-neutral-400">
                <ScanSearch size={26} aria-hidden="true" />
              </span>

              <h3 className="mt-5 text-lg font-semibold text-white">
                Scan visible text
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
                VeilShot can suggest regions containing emails, phone numbers,
                OTPs, payment-card numbers, UPI IDs, URLs, IP addresses, API
                keys, access tokens, and transaction IDs.
              </p>

              <button
                type="button"
                onClick={() => void startScan()}
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black transition hover:bg-neutral-200"
              >
                <ScanSearch size={17} aria-hidden="true" />
                Start local scan
              </button>
            </div>
          ) : null}

          {isScanning ? (
            <div className="py-12">
              <div className="mx-auto max-w-md text-center">
                <Loader2
                  size={30}
                  className="mx-auto animate-spin text-violet-400"
                  aria-hidden="true"
                />

                <p className="mt-5 text-sm font-medium text-neutral-200">
                  {progress.message}
                </p>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-neutral-800">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-[width] duration-300"
                    style={{
                      width: `${Math.round(progress.progress * 100)}%`,
                    }}
                  />
                </div>

                <p className="mt-2 font-mono text-xs text-neutral-600">
                  {Math.round(progress.progress * 100)}%
                </p>

                <button
                  type="button"
                  onClick={cancelScan}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition hover:bg-neutral-800"
                >
                  <Square size={13} fill="currentColor" aria-hidden="true" />
                  Cancel scan
                </button>
              </div>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/[0.08] p-4">
              <p className="text-sm font-medium text-red-200">{errorMessage}</p>

              <button
                type="button"
                onClick={() => void startScan()}
                className="mt-4 rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-100 transition hover:bg-red-500/20"
              >
                Try again
              </button>
            </div>
          ) : null}

          {!isScanning && suggestions.length > 0 ? (
            <div className="mt-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-semibold text-white">
                    {suggestions.length} possible sensitive{" "}
                    {suggestions.length === 1 ? "detail" : "details"}
                  </h3>

                  <p className="mt-1 text-sm text-neutral-500">
                    Review each suggestion before applying it.
                  </p>
                </div>

                <div className="flex gap-2 sm:ml-auto">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="rounded-lg border border-neutral-800 px-3 py-2 text-xs font-medium text-neutral-300 transition hover:bg-neutral-900"
                  >
                    Select all
                  </button>

                  <button
                    type="button"
                    onClick={clearSelection}
                    className="rounded-lg border border-neutral-800 px-3 py-2 text-xs font-medium text-neutral-300 transition hover:bg-neutral-900"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {suggestions.map((suggestion) => (
                  <SuggestionItem
                    key={suggestion.id}
                    suggestion={suggestion}
                    onToggle={() => toggleSuggestion(suggestion.id)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {progress.status === "completed" && suggestions.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle2
                size={32}
                className="mx-auto text-emerald-400"
                aria-hidden="true"
              />

              <h3 className="mt-4 font-semibold text-white">Scan complete</h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
                No common sensitive-data patterns were found. Review the image
                manually because OCR may miss some details.
              </p>

              <button
                type="button"
                onClick={() => void startScan()}
                className="mt-5 rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition hover:bg-neutral-800"
              >
                Scan again
              </button>
            </div>
          ) : null}
        </div>

        <footer className="flex flex-col gap-3 border-t border-neutral-800 p-5 sm:flex-row sm:items-center">
          <p className="text-xs leading-5 text-neutral-600">
            Selected suggestions use the active{" "}
            <span className="font-medium text-neutral-400">
              {protectionMode}
            </span>{" "}
            protection preset.
          </p>

          <button
            type="button"
            onClick={applySelectedSuggestions}
            disabled={isScanning || selectedSuggestions.length === 0}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40 sm:ml-auto"
          >
            <Check size={17} aria-hidden="true" />
            Apply{" "}
            {selectedSuggestions.length > 0
              ? selectedSuggestions.length
              : ""}{" "}
            {selectedSuggestions.length === 1 ? "suggestion" : "suggestions"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function SuggestionItem({
  suggestion,
  onToggle,
}: {
  suggestion: PrivacySuggestion;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={suggestion.selected}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition",
        suggestion.selected
          ? "border-violet-500/40 bg-violet-500/[0.08]"
          : "border-neutral-800 bg-neutral-900/60 hover:border-neutral-700",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border",
          suggestion.selected
            ? "border-violet-500 bg-violet-500 text-white"
            : "border-neutral-700 bg-neutral-900 text-transparent",
        )}
      >
        <Check size={13} aria-hidden="true" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-neutral-200">
            {suggestion.label}
          </span>

          <span className="rounded-full bg-neutral-800 px-2 py-0.5 font-mono text-[10px] text-neutral-500">
            {Math.round(suggestion.confidence * 100)}%
          </span>
        </span>

        <span className="mt-1 block truncate font-mono text-xs text-neutral-500">
          {suggestion.matchedText}
        </span>
      </span>
    </button>
  );
}

function createAnnotationFromSuggestion({
  suggestion,
  imageWidth,
  imageHeight,
  preset,
}: {
  suggestion: PrivacySuggestion;
  imageWidth: number;
  imageHeight: number;
  preset: ReturnType<typeof getProtectionPreset>;
}): Annotation {
  const horizontalPadding = Math.max(4, suggestion.width * 0.035);

  const verticalPadding = Math.max(3, suggestion.height * 0.15);

  const x = clamp(suggestion.x - horizontalPadding, 0, imageWidth);

  const y = clamp(suggestion.y - verticalPadding, 0, imageHeight);

  const width = clamp(
    suggestion.width + horizontalPadding * 2,
    6,
    imageWidth - x,
  );

  const height = clamp(
    suggestion.height + verticalPadding * 2,
    6,
    imageHeight - y,
  );

  return {
    id: createAnnotationId(),
    tool: preset.tool,
    x,
    y,
    width,
    height,
    blurStrength: preset.blurStrength,
    pixelSize: preset.pixelSize,
    redactColor: preset.redactColor,
  };
}

function createAnnotationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `scan-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
