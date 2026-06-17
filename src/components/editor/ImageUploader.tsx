"use client";

import React, { useCallback, useRef, useState } from "react";
import {
  FileImage,
  ImageIcon,
  Loader2,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { useEditor } from "@/providers/EditorProvider";
import { cn } from "@/lib/cn";
import {
  ImageValidationError,
  validateImageFile,
} from "@/features/image-processing/validate-image";

export function ImageUploader() {
  const { setImage } = useEditor();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setIsLoading(true);

      try {
        const validated = await validateImageFile(file);
        setImage(file, validated.objectUrl, validated.bounds);
      } catch (caughtError) {
        setError(
          caughtError instanceof ImageValidationError
            ? caughtError.message
            : "The image could not be opened. Try another file.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [setImage],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const onFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) void handleFile(file);
      event.target.value = "";
    },
    [handleFile],
  );

  return (
    <div className="flex h-full w-full items-center justify-center p-5 sm:p-10">
      <div
        className={cn(
          "relative flex w-full max-w-3xl flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-dashed px-6 py-16 text-center shadow-2xl transition duration-200 sm:px-12",
          isDragging
            ? "scale-[1.01] border-violet-400 bg-violet-500/10 shadow-violet-950/50"
            : "border-neutral-700 bg-neutral-900/60 hover:border-neutral-500",
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.15),transparent_45%)]" />

        <div className="relative mb-7 flex h-24 w-24 items-center justify-center rounded-3xl border border-neutral-700 bg-neutral-950 shadow-xl">
          {isLoading ? (
            <Loader2 className="h-10 w-10 animate-spin text-violet-400" />
          ) : (
            <UploadCloud className="h-10 w-10 text-violet-400" />
          )}
        </div>

        <h1 className="relative text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Add a screenshot
        </h1>
        <p className="relative mt-4 max-w-xl text-base leading-7 text-neutral-400">
          Drag in a PNG, JPG, or WebP image, then mark every detail that should
          not be shared.
        </p>

        <div className="relative mt-8 flex flex-col items-center gap-4 sm:flex-row">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 font-semibold text-white shadow-lg shadow-violet-950/50 transition hover:bg-violet-500 disabled:cursor-wait disabled:opacity-60"
          >
            <ImageIcon size={18} />
            Choose image
          </button>
          <span className="text-sm text-neutral-500">Maximum 15 MB</span>
        </div>

        <input
          ref={inputRef}
          type="file"
          aria-label="Choose a PNG, JPG, or WebP screenshot"
          className="sr-only"
          accept="image/png,image/jpeg,image/webp"
          onChange={onFileInputChange}
        />

        {error ? (
          <div
            role="alert"
            className="relative mt-6 flex max-w-xl items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-left text-sm text-red-200"
          >
            <FileImage className="mt-0.5 shrink-0" size={18} />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="relative mt-10 flex items-center gap-2 text-sm font-medium text-emerald-300">
          <ShieldCheck size={17} />
          Processed locally. Never uploaded.
        </div>
      </div>
    </div>
  );
}
