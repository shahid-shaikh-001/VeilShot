"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Copy,
  Download,
  FileImage,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  copyBlobToClipboard,
  createExportFilename,
  downloadBlob,
  renderProtectedImage,
} from "@/features/export/export-image";
import { cn } from "@/lib/cn";
import { useEditor } from "@/providers/EditorProvider";

import type { ExportFormat } from "@/types/editor";

export function ExportDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { imageFile, imageUrl, imageBounds, annotations } = useEditor();

  const [format, setFormat] = useState<ExportFormat>("png");

  const [quality, setQuality] = useState(92);

  const [busyAction, setBusyAction] = useState<"download" | "copy" | null>(
    null,
  );

  const filename = useMemo(
    () => createExportFilename(imageFile?.name ?? "protected-image", format),
    [format, imageFile?.name],
  );

  if (!open) {
    return null;
  }

  const generate = async () => {
    if (!imageUrl || !imageBounds) {
      throw new Error("No image is loaded.");
    }

    return renderProtectedImage({
      imageUrl,
      imageBounds,
      annotations,
      format,
      quality: quality / 100,
    });
  };

  const handleDownload = async () => {
    setBusyAction("download");

    try {
      const blob = await generate();

      downloadBlob(blob, filename);

      toast.success(
        "Protected image downloaded with original metadata removed.",
      );

      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The protected image could not be generated.",
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleCopy = async () => {
    setBusyAction("copy");

    try {
      if (!imageUrl || !imageBounds) {
        throw new Error("No image is loaded.");
      }

      const blob = await renderProtectedImage({
        imageUrl,
        imageBounds,
        annotations,
        format: "png",
      });

      await copyBlobToClipboard(blob);

      toast.success("Protected image copied with original metadata removed.");

      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Clipboard access failed. Use Download instead.",
      );
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Export protected image"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busyAction) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-950 shadow-2xl">
        <div className="flex items-center border-b border-neutral-800 px-5 py-4">
          <div>
            <h2 className="font-semibold text-white">Export protected image</h2>

            <p className="mt-1 text-xs text-neutral-500">
              Original dimensions are preserved.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(busyAction)}
            aria-label="Close export dialog"
            className="ml-auto rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-white disabled:opacity-40"
          >
            <X size={19} />
          </button>
        </div>

        <div className="space-y-6 p-5">
          <fieldset>
            <legend className="mb-3 text-sm font-medium text-neutral-300">
              File format
            </legend>

            <div className="grid grid-cols-2 gap-3">
              {(["png", "jpeg"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFormat(item)}
                  aria-pressed={format === item}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left transition",
                    format === item
                      ? "border-violet-500 bg-violet-500/10 text-white"
                      : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700",
                  )}
                >
                  <span className="block text-sm font-semibold uppercase">
                    {item === "jpeg" ? "JPG" : "PNG"}
                  </span>

                  <span className="mt-1 block text-xs text-neutral-500">
                    {item === "png"
                      ? "Best for screenshots"
                      : "Smaller file size"}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          {format === "jpeg" ? (
            <label className="block text-sm text-neutral-300">
              <span className="flex justify-between">
                JPEG quality
                <span className="font-mono text-xs text-neutral-500">
                  {quality}%
                </span>
              </span>

              <input
                type="range"
                min={60}
                max={100}
                value={quality}
                onChange={(event) => setQuality(Number(event.target.value))}
                className="mt-3 w-full accent-violet-500"
              />
            </label>
          ) : null}

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-neutral-400">
                <FileImage size={17} aria-hidden="true" />
              </span>

              <div className="min-w-0">
                <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
                  Output filename
                </p>

                <p className="mt-1 truncate font-mono text-sm text-neutral-200">
                  {filename}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
              <ShieldCheck size={18} aria-hidden="true" />
              Export privacy protection
            </div>

            <div className="mt-4 space-y-3">
              <PrivacyStatusItem
                label={`${annotations.length} protection ${
                  annotations.length === 1 ? "region" : "regions"
                } permanently applied`}
              />

              <PrivacyStatusItem label="Original image metadata removed" />

              <PrivacyStatusItem label="Generated entirely inside your browser" />
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 text-sm leading-6 text-neutral-400">
            <LockKeyhole
              className="mt-0.5 shrink-0 text-violet-400"
              size={17}
              aria-hidden="true"
            />

            <p>
              VeilShot creates a newly rendered image. The original file and its
              embedded metadata are not included in the exported copy.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-neutral-800 p-5">
          <button
            type="button"
            onClick={() => void handleCopy()}
            disabled={Boolean(busyAction)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-wait disabled:opacity-50"
          >
            {busyAction === "copy" ? (
              <Loader2 className="animate-spin" size={17} />
            ) : (
              <Copy size={17} />
            )}
            Copy
          </button>

          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={Boolean(busyAction)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-wait disabled:opacity-50"
          >
            {busyAction === "download" ? (
              <Loader2 className="animate-spin" size={17} />
            ) : (
              <Download size={17} />
            )}
            Download
          </button>
        </div>
      </div>
    </div>
  );
}

function PrivacyStatusItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-emerald-100/80">
      <CheckCircle2
        size={16}
        className="shrink-0 text-emerald-400"
        aria-hidden="true"
      />

      <span>{label}</span>
    </div>
  );
}
