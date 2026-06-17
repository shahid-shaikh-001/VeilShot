export type ToolType = "select" | "blur" | "pixelate" | "redact";

export type EffectType = Exclude<ToolType, "select">;

export type ExportFormat = "png" | "jpeg";

export type ProtectionMode = "standard" | "strong" | "permanent";

export interface ImageBounds {
  width: number;
  height: number;
}

export interface Annotation {
  id: string;
  tool: EffectType;

  x: number;
  y: number;
  width: number;
  height: number;

  blurStrength: number;
  pixelSize: number;
  redactColor: string;
}

export interface AnnotationSnapshot {
  annotations: Annotation[];
  selectedAnnotationId: string | null;
}

export interface ExportSettings {
  format: ExportFormat;
  quality: number;
  filename: string;
}

export interface EditorState {
  imageFile: File | null;
  imageUrl: string | null;

  activeTool: ToolType;
  protectionMode: ProtectionMode;

  imageBounds: ImageBounds | null;

  annotations: Annotation[];
  selectedAnnotationId: string | null;

  zoom: number;

  past: AnnotationSnapshot[];
  future: AnnotationSnapshot[];
}
