"use client";

import { useEffect, useState } from "react";
import { Eye, Loader2, X } from "lucide-react";
import { renderProtectedImage } from "@/features/export/export-image";
import { useEditor } from "@/providers/EditorProvider";
import { cn } from "@/lib/cn";

export function PreviewDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return <PreviewDialogContent onClose={onClose} />;
}

function PreviewDialogContent({ onClose }: { onClose: () => void }) {
  const { imageUrl, imageBounds, annotations } = useEditor();
  const [mode, setMode] = useState<"original" | "protected">("protected");
  const [protectedUrl, setProtectedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUrl || !imageBounds) return;
    let active = true;
    let generatedUrl: string | null = null;

    void renderProtectedImage({
      imageUrl,
      imageBounds,
      annotations,
      format: "png",
    })
      .then((blob) => {
        if (!active) return;
        generatedUrl = URL.createObjectURL(blob);
        setProtectedUrl(generatedUrl);
      })
      .catch(() => {
        if (active) setError("The protected preview could not be generated.");
      });

    return () => {
      active = false;
      if (generatedUrl) URL.revokeObjectURL(generatedUrl);
    };
  }, [annotations, imageBounds, imageUrl]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Review protected image"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-950 shadow-2xl">
        <div className="flex items-center border-b border-neutral-800 px-5 py-4">
          <div className="flex items-center gap-2 font-semibold text-white">
            <Eye size={18} className="text-violet-400" />
            Review before sharing
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="ml-auto rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <X size={19} />
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 border-b border-neutral-800 p-3">
          {(["original", "protected"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium capitalize transition",
                mode === item
                  ? "bg-violet-600 text-white"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-white",
              )}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-[#08080a] p-5">
          {error ? (
            <div className="mx-auto max-w-md rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-200">
              {error}
            </div>
          ) : mode === "protected" && !protectedUrl ? (
            <div className="flex min-h-80 items-center justify-center gap-3 text-neutral-400">
              <Loader2 className="animate-spin" size={20} />
              Generating full-resolution preview…
            </div>
          ) : (
            // Native img is required because both sources are temporary object URLs.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={
                mode === "original" ? (imageUrl ?? "") : (protectedUrl ?? "")
              }
              alt={
                mode === "original"
                  ? "Original uploaded screenshot"
                  : "Protected screenshot preview"
              }
              className="mx-auto h-auto max-w-full rounded-lg border border-neutral-800 shadow-2xl"
            />
          )}
        </div>

        <p className="border-t border-neutral-800 px-5 py-4 text-center text-sm text-amber-200/80">
          Inspect the complete image. Solid redaction is safest for highly
          sensitive information.
        </p>
      </div>
    </div>
  );
}
