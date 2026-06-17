"use client";

import { Droplet, Grid3X3, ListFilter, Shield, Trash2 } from "lucide-react";

import { ProtectionModeSelector } from "@/components/editor/ProtectionModeSelector";
import { cn } from "@/lib/cn";
import { useEditor } from "@/providers/EditorProvider";

import type { Annotation, EffectType } from "@/types/editor";

const effectOptions: Array<{
  id: EffectType;
  label: string;
  icon: typeof Droplet;
}> = [
  {
    id: "blur",
    label: "Blur",
    icon: Droplet,
  },
  {
    id: "pixelate",
    label: "Pixelate",
    icon: Grid3X3,
  },
  {
    id: "redact",
    label: "Redact",
    icon: Shield,
  },
];

export function EditorSidebar() {
  const {
    annotations,
    selectedAnnotation,
    selectedAnnotationId,
    imageBounds,
    selectAnnotation,
    updateAnnotation,
    deleteAnnotation,
    setActiveTool,
  } = useEditor();

  const updateNumber = (key: "x" | "y" | "width" | "height", value: number) => {
    if (!selectedAnnotation || !imageBounds || Number.isNaN(value)) {
      return;
    }

    const maximum =
      key === "x"
        ? imageBounds.width - selectedAnnotation.width
        : key === "y"
          ? imageBounds.height - selectedAnnotation.height
          : key === "width"
            ? imageBounds.width - selectedAnnotation.x
            : imageBounds.height - selectedAnnotation.y;

    const minimum = key === "width" || key === "height" ? 6 : 0;

    const safeMaximum = Math.max(minimum, maximum);

    updateAnnotation(selectedAnnotation.id, {
      [key]: Math.max(minimum, Math.min(value, safeMaximum)),
    });
  };

  return (
    <aside className="flex max-h-[46dvh] min-h-0 w-full min-w-0 shrink-0 flex-col overflow-hidden border-t border-neutral-800 bg-neutral-950/95 lg:h-full lg:max-h-none lg:w-72 lg:border-t-0 lg:border-l xl:w-80">
      {/* Sidebar header */}
      <div className="shrink-0 border-b border-neutral-800 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex min-w-0 items-center gap-2">
          <ListFilter
            size={17}
            className="shrink-0 text-violet-400"
            aria-hidden="true"
          />

          <h2 className="truncate font-semibold text-white">
           Protection regions
          </h2>

          <span className="ml-auto shrink-0 rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300">
            {annotations.length}
          </span>
        </div>
      </div>

      {/* Scrollable sidebar content */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <ProtectionModeSelector />

        {selectedAnnotation ? (
          <section className="border-b border-neutral-800 p-4 sm:p-5">
            <p className="mb-3 text-xs font-semibold tracking-wider text-neutral-500 uppercase">
              Selected effect
            </p>

            <div className="grid grid-cols-3 gap-2">
              {effectOptions.map((effect) => {
                const Icon = effect.icon;
                const isActive = selectedAnnotation.tool === effect.id;

                return (
                  <button
                    key={effect.id}
                    type="button"
                    onClick={() =>
                      updateAnnotation(selectedAnnotation.id, {
                        tool: effect.id,
                      })
                    }
                    aria-pressed={isActive}
                    className={cn(
                      "flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-1 text-xs font-medium transition",
                      isActive
                        ? "border-violet-500 bg-violet-500/15 text-violet-200"
                        : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700 hover:text-white",
                    )}
                  >
                    <Icon size={17} className="shrink-0" aria-hidden="true" />

                    <span className="truncate">{effect.label}</span>
                  </button>
                );
              })}
            </div>

            {selectedAnnotation.tool === "blur" ? (
              <RangeControl
                label="Blur strength"
                value={selectedAnnotation.blurStrength}
                min={4}
                max={40}
                onChange={(value) =>
                  updateAnnotation(selectedAnnotation.id, {
                    blurStrength: value,
                  })
                }
              />
            ) : null}

            {selectedAnnotation.tool === "pixelate" ? (
              <RangeControl
                label="Pixel size"
                value={selectedAnnotation.pixelSize}
                min={6}
                max={40}
                onChange={(value) =>
                  updateAnnotation(selectedAnnotation.id, {
                    pixelSize: value,
                  })
                }
              />
            ) : null}

            {selectedAnnotation.tool === "redact" ? (
              <label className="mt-5 flex items-center justify-between gap-3 text-sm text-neutral-300">
                <span>Redaction colour</span>

                <input
                  type="color"
                  value={selectedAnnotation.redactColor}
                  onChange={(event) =>
                    updateAnnotation(selectedAnnotation.id, {
                      redactColor: event.target.value,
                    })
                  }
                  aria-label="Redaction colour"
                  className="h-9 w-12 shrink-0 cursor-pointer rounded border border-neutral-700 bg-neutral-900 p-1"
                />
              </label>
            ) : null}

            {/* Position and size */}
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {(["x", "y", "width", "height"] as const).map((key) => (
                <label key={key} className="min-w-0 text-xs text-neutral-500">
                  {key === "width"
                    ? "W"
                    : key === "height"
                      ? "H"
                      : key.toUpperCase()}

                  <input
                    type="number"
                    value={Math.round(selectedAnnotation[key])}
                    onChange={(event) =>
                      updateNumber(key, Number(event.target.value))
                    }
                    className="mt-1 w-full min-w-0 rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-2 text-sm text-neutral-200 transition outline-none focus:border-violet-500"
                  />
                </label>
              ))}
            </div>

            <button
              type="button"
              onClick={() => deleteAnnotation(selectedAnnotation.id)}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
            >
              <Trash2 size={16} aria-hidden="true" />
              Delete region
            </button>
          </section>
        ) : (
          <div className="border-b border-neutral-800 p-4 text-sm leading-6 text-neutral-500 sm:p-5">
            Choose a protection tool and draw over private information. Select a
            region to edit its size and strength.
          </div>
        )}

        {/* Region list */}
        <div className="space-y-2 p-3">
          {annotations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-800 px-4 py-5 text-center text-xs leading-5 text-neutral-600">
              No protection regions added yet.
            </div>
          ) : (
            annotations.map((annotation, index) => (
              <RegionItem
                key={annotation.id}
                annotation={annotation}
                index={index}
                active={annotation.id === selectedAnnotationId}
                onSelect={() => {
                  setActiveTool("select");
                  selectAnnotation(annotation.id);
                }}
                onDelete={() => deleteAnnotation(annotation.id)}
              />
            ))
          )}
        </div>
      </div>
    </aside>
  );
}

function RangeControl({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="mt-5 block text-sm text-neutral-300">
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>

        <span className="font-mono text-xs text-neutral-500">{value}</span>
      </span>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 w-full accent-violet-500"
      />
    </label>
  );
}

function RegionItem({
  annotation,
  index,
  active,
  onSelect,
  onDelete,
}: {
  annotation: Annotation;
  index: number;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const labels: Record<EffectType, string> = {
    blur: "Blur",
    pixelate: "Pixelate",
    redact: "Redaction",
  };

  return (
    <div
      className={cn(
        "group flex min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 transition",
        active
          ? "border-violet-500/60 bg-violet-500/10"
          : "border-transparent bg-neutral-900/70 hover:border-neutral-700",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 flex-1 text-left"
      >
        <span className="block truncate text-sm font-medium text-neutral-200">
          {labels[annotation.tool]} {index + 1}
        </span>

        <span className="mt-0.5 block truncate font-mono text-[11px] text-neutral-500">
          {Math.round(annotation.width)} × {Math.round(annotation.height)} px
        </span>
      </button>

      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${labels[annotation.tool]} region ${index + 1}`}
        className="shrink-0 rounded-lg p-2 text-neutral-600 transition hover:bg-red-500/10 hover:text-red-300"
      >
        <Trash2 size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
