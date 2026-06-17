"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { EditorSidebar } from "@/components/editor/EditorSidebar";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { ImageUploader } from "@/components/editor/ImageUploader";
import { useEditorShortcuts } from "@/hooks/useEditorShortcuts";
import { EditorProvider, useEditor } from "@/providers/EditorProvider";

const EditorCanvas = dynamic(
  () =>
    import("@/components/editor/EditorCanvas").then(
      (module) => module.EditorCanvas,
    ),
  { ssr: false },
);

function EditorWorkspace() {
  const { imageUrl, imageFile, imageBounds, annotations } = useEditor();
  useEditorShortcuts();

  if (!imageUrl) {
    return <ImageUploader />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <EditorToolbar />
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="min-h-0 flex-1">
          <EditorCanvas />
        </div>
        <EditorSidebar />
      </div>
      <div className="flex min-h-9 shrink-0 items-center gap-4 overflow-x-auto border-t border-neutral-800 bg-neutral-950 px-4 font-mono text-[11px] text-neutral-500">
        <span className="truncate">{imageFile?.name}</span>
        {imageBounds ? (
          <span>
            {imageBounds.width} × {imageBounds.height}px
          </span>
        ) : null}
        <span>{annotations.length} protected region(s)</span>
        <span className="ml-auto flex items-center gap-1.5 text-emerald-400/90">
          <ShieldCheck size={13} />
          Local processing
        </span>
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <EditorProvider>
      <main className="flex h-dvh flex-col overflow-hidden bg-neutral-950 text-neutral-100">
        <header className="flex h-14 shrink-0 items-center border-b border-neutral-800 bg-neutral-950 px-3 sm:px-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-neutral-400 transition hover:bg-neutral-900 hover:text-white"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-sm font-semibold tracking-tight text-white sm:text-base">
            VeilShot Editor
          </div>
          <div className="ml-auto hidden items-center gap-2 text-xs text-neutral-500 sm:flex">
            No uploads. No storage.
          </div>
        </header>

        <EditorWorkspace />
      </main>
    </EditorProvider>
  );
}
