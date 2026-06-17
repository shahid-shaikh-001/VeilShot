"use client";

import { Gauge, LockKeyhole, ShieldCheck } from "lucide-react";

import { protectionPresets } from "@/features/editor/protection-presets";
import { cn } from "@/lib/cn";
import { useEditor } from "@/providers/EditorProvider";

import type { ProtectionMode } from "@/types/editor";

const modeOptions: Array<{
  id: ProtectionMode;
  icon: typeof Gauge;
}> = [
  {
    id: "standard",
    icon: Gauge,
  },
  {
    id: "strong",
    icon: ShieldCheck,
  },
  {
    id: "permanent",
    icon: LockKeyhole,
  },
];

export function ProtectionModeSelector() {
  const { protectionMode, selectedAnnotation, setProtectionMode } = useEditor();

  return (
    <section className="border-b border-neutral-800 p-5">
      <p className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">
        Quick protection mode
      </p>

      <p className="mt-1 text-xs leading-5 text-neutral-600">
        {selectedAnnotation
          ? "Apply a protection preset to the selected region."
          : "Choose the default protection for the next region."}
      </p>

      <div className="mt-4 grid gap-2">
        {modeOptions.map((mode) => {
          const preset = protectionPresets[mode.id];
          const Icon = mode.icon;
          const isActive = protectionMode === mode.id;

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => setProtectionMode(mode.id)}
              aria-pressed={isActive}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition",
                isActive
                  ? "border-violet-500/60 bg-violet-500/10"
                  : "border-neutral-800 bg-neutral-900 hover:border-neutral-700 hover:bg-neutral-800/70",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  isActive
                    ? "bg-violet-500/15 text-violet-300"
                    : "bg-neutral-800 text-neutral-400",
                )}
              >
                <Icon size={17} aria-hidden="true" />
              </span>

              <span className="min-w-0">
                <span
                  className={cn(
                    "block text-sm font-semibold",
                    isActive ? "text-violet-100" : "text-neutral-200",
                  )}
                >
                  {preset.label}
                </span>

                <span className="mt-1 block text-xs leading-5 text-neutral-500">
                  {preset.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
