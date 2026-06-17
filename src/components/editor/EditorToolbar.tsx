"use client";

import React, { useState } from "react";
import {
  Download,
  Droplet,
  Eye,
  Grid3X3,
  Maximize2,
  MousePointer2,
  Redo2,
  RotateCcw,
  ScanSearch,
  Shield,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { ExportDialog } from "@/components/editor/ExportDialog";
import { PreviewDialog } from "@/components/editor/PreviewDialog";
import { PrivacyScanDialog } from "@/components/editor/PrivacyScanDialog";
import { cn } from "@/lib/cn";
import { useEditor } from "@/providers/EditorProvider";

import type { ToolType } from "@/types/editor";

const tools: Array<{
  id: ToolType;
  icon: React.ElementType;
  label: string;
  shortcut: string;
}> = [
  {
    id: "select",
    icon: MousePointer2,
    label: "Select",
    shortcut: "V",
  },
  {
    id: "blur",
    icon: Droplet,
    label: "Blur",
    shortcut: "B",
  },
  {
    id: "pixelate",
    icon: Grid3X3,
    label: "Pixelate",
    shortcut: "P",
  },
  {
    id: "redact",
    icon: Shield,
    label: "Redact",
    shortcut: "R",
  },
];

export function EditorToolbar() {
  const {
    activeTool,
    setActiveTool,
    annotations,
    clearAnnotations,
    resetEditor,
    undo,
    redo,
    canUndo,
    canRedo,
    zoom,
    setZoom,
  } = useEditor();

  const [previewOpen, setPreviewOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [privacyScanOpen, setPrivacyScanOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const zoomOut = () => {
    setZoom(Number(Math.max(0.35, zoom - 0.15).toFixed(2)));
  };

  const zoomIn = () => {
    setZoom(Number(Math.min(3, zoom + 0.15).toFixed(2)));
  };

  return (
    <>
      <div className="shrink-0 border-b border-neutral-800 bg-neutral-950/95 p-2 sm:p-3">
        <div className="flex min-w-0 flex-col gap-2 xl:flex-row xl:items-center">
          {/* Scrollable editing controls */}
          <div className="flex max-w-full min-w-0 items-center gap-2 overflow-x-auto pb-1 xl:pb-0">
            {/* Protection tools */}
            <div className="flex shrink-0 items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-900 p-1">
              {tools.map((tool) => {
                const Icon = tool.icon;
                const active = activeTool === tool.id;

                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => setActiveTool(tool.id)}
                    title={`${tool.label} (${tool.shortcut})`}
                    aria-label={`${tool.label} tool`}
                    aria-pressed={active}
                    className={cn(
                      "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition",
                      active
                        ? "bg-violet-600 text-white shadow-lg shadow-violet-950/40"
                        : "text-neutral-400 hover:bg-neutral-800 hover:text-white",
                    )}
                  >
                    <Icon size={17} aria-hidden="true" />

                    <span className="hidden md:inline">{tool.label}</span>
                  </button>
                );
              })}
            </div>

            <ToolbarDivider />

            {/* History */}
            <div className="flex shrink-0 items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-900 p-1">
              <IconButton
                label="Undo (Ctrl+Z)"
                disabled={!canUndo}
                onClick={undo}
              >
                <Undo2 size={18} />
              </IconButton>

              <IconButton
                label="Redo (Ctrl+Shift+Z)"
                disabled={!canRedo}
                onClick={redo}
              >
                <Redo2 size={18} />
              </IconButton>

              <IconButton
                label="Clear all protection regions"
                disabled={annotations.length === 0}
                danger
                onClick={clearAnnotations}
              >
                <Trash2 size={18} />
              </IconButton>
            </div>

            <ToolbarDivider />

            {/* Zoom */}
            <div className="flex shrink-0 items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-900 p-1">
              <IconButton
                label="Zoom out"
                disabled={zoom <= 0.35}
                onClick={zoomOut}
              >
                <ZoomOut size={17} />
              </IconButton>

              <button
                type="button"
                onClick={() => setZoom(1)}
                title="Reset zoom"
                className="h-10 min-w-14 rounded-lg px-2 font-mono text-xs text-neutral-300 transition hover:bg-neutral-800"
              >
                {Math.round(zoom * 100)}%
              </button>

              <IconButton label="Zoom in" disabled={zoom >= 3} onClick={zoomIn}>
                <ZoomIn size={17} />
              </IconButton>

              <IconButton
                label="Fit image to workspace"
                onClick={() => setZoom(1)}
              >
                <Maximize2 size={17} />
              </IconButton>
            </div>
          </div>

          {/* Main actions */}
          <div className="grid min-w-0 grid-cols-4 gap-2 xl:ml-auto xl:flex xl:shrink-0">
            <ActionButton
              label="New image"
              shortLabel="New"
              icon={RotateCcw}
              onClick={() => setResetOpen(true)}
            />

            <ActionButton
              label="Smart Scan"
              shortLabel="Scan"
              icon={ScanSearch}
              variant="violet"
              onClick={() => setPrivacyScanOpen(true)}
            />

            <ActionButton
              label="Preview"
              shortLabel="Preview"
              icon={Eye}
              variant="secondary"
              onClick={() => setPreviewOpen(true)}
            />

            <ActionButton
              label="Export"
              shortLabel="Export"
              icon={Download}
              variant="primary"
              onClick={() => setExportOpen(true)}
            />
          </div>
        </div>
      </div>

      {privacyScanOpen ? (
        <PrivacyScanDialog onClose={() => setPrivacyScanOpen(false)} />
      ) : null}

      <PreviewDialog open={previewOpen} onClose={() => setPreviewOpen(false)} />

      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />

      {resetOpen ? (
        <ConfirmResetDialog
          onCancel={() => setResetOpen(false)}
          onConfirm={() => {
            setPrivacyScanOpen(false);
            setPreviewOpen(false);
            setExportOpen(false);
            resetEditor();
            setResetOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function ActionButton({
  label,
  shortLabel,
  icon: Icon,
  variant = "ghost",
  onClick,
}: {
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  variant?: "ghost" | "secondary" | "violet" | "primary";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        "inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-xl px-2 text-xs font-semibold transition sm:px-3 sm:text-sm xl:px-4",
        variant === "ghost" &&
          "text-neutral-400 hover:bg-neutral-800 hover:text-white",
        variant === "secondary" &&
          "border border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800",
        variant === "violet" &&
          "border border-violet-500/30 bg-violet-500/10 text-violet-200 hover:border-violet-500/50 hover:bg-violet-500/20",
        variant === "primary" && "bg-white text-black hover:bg-neutral-200",
      )}
    >
      <Icon size={17} className="shrink-0" aria-hidden="true" />

      <span className="truncate sm:hidden">{shortLabel}</span>
      <span className="hidden truncate sm:inline">{label}</span>
    </button>
  );
}

function IconButton({
  label,
  disabled,
  danger = false,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-neutral-400",
        danger && "hover:bg-red-500/10 hover:text-red-300",
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return (
    <div aria-hidden="true" className="h-8 w-px shrink-0 bg-neutral-800" />
  );
}

function ConfirmResetDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="reset-title"
        className="w-full max-w-md rounded-2xl border border-neutral-700 bg-neutral-950 p-5 shadow-2xl sm:p-6"
      >
        <h2 id="reset-title" className="text-lg font-semibold text-white">
          Start with a new image?
        </h2>

        <p className="mt-3 text-sm leading-6 text-neutral-400">
          The current screenshot and all protection regions will be removed.
          This action cannot be undone.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Keep editing
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-400"
          >
            Remove image
          </button>
        </div>
      </div>
    </div>
  );
}
