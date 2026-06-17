import type { EffectType, ProtectionMode } from "@/types/editor";

export interface ProtectionPreset {
  id: ProtectionMode;
  label: string;
  description: string;
  tool: EffectType;
  blurStrength: number;
  pixelSize: number;
  redactColor: string;
}

export const protectionPresets: Record<ProtectionMode, ProtectionPreset> = {
  standard: {
    id: "standard",
    label: "Standard",
    description: "Balanced protection for everyday screenshots.",
    tool: "blur",
    blurStrength: 18,
    pixelSize: 14,
    redactColor: "#050505",
  },

  strong: {
    id: "strong",
    label: "Strong",
    description: "Stronger hiding for personal and financial details.",
    tool: "pixelate",
    blurStrength: 28,
    pixelSize: 22,
    redactColor: "#050505",
  },

  permanent: {
    id: "permanent",
    label: "Permanent",
    description: "Opaque redaction for highly sensitive information.",
    tool: "redact",
    blurStrength: 36,
    pixelSize: 28,
    redactColor: "#000000",
  },
};

export function getProtectionPreset(mode: ProtectionMode): ProtectionPreset {
  return protectionPresets[mode];
}
