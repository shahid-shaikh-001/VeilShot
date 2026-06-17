import type { Annotation, ExportFormat, ImageBounds } from "@/types/editor";

interface RenderProtectedImageInput {
  imageUrl: string;
  imageBounds: ImageBounds;
  annotations: Annotation[];
  format: ExportFormat;
  quality?: number;
}

export async function renderProtectedImage({
  imageUrl,
  imageBounds,
  annotations,
  format,
  quality = 0.92,
}: RenderProtectedImageInput): Promise<Blob> {
  const image = await loadImage(imageUrl);
  const canvas = document.createElement("canvas");
  canvas.width = imageBounds.width;
  canvas.height = imageBounds.height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Canvas rendering is unavailable in this browser.");
  }

  if (format === "jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, imageBounds.width, imageBounds.height);
  }

  context.drawImage(image, 0, 0, imageBounds.width, imageBounds.height);

  for (const annotation of annotations) {
    const region = clampRegion(annotation, imageBounds);
    if (region.width < 1 || region.height < 1) continue;

    if (annotation.tool === "redact") {
      context.save();
      context.fillStyle = annotation.redactColor;
      context.fillRect(region.x, region.y, region.width, region.height);
      context.restore();
      continue;
    }

    if (annotation.tool === "pixelate") {
      applyPixelation(context, canvas, region, annotation.pixelSize);
      continue;
    }

    applyBlur(context, canvas, region, annotation.blurStrength);
  }

  const mimeType = format === "png" ? "image/png" : "image/jpeg";
  return canvasToBlob(
    canvas,
    mimeType,
    format === "jpeg" ? quality : undefined,
  );
}

export function downloadBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
}

export async function copyBlobToClipboard(blob: Blob): Promise<void> {
  if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
    throw new Error("Image clipboard access is not supported by this browser.");
  }

  const pngBlob =
    blob.type === "image/png" ? blob : await convertBlobToPng(blob);

  await navigator.clipboard.write([
    new ClipboardItem({
      "image/png": pngBlob,
    }),
  ]);
}

export function createExportFilename(
  originalFilename: string,
  format: ExportFormat,
): string {
  const withoutExtension = originalFilename.replace(/\.[^/.]+$/, "");
  const safeBase =
    withoutExtension
      .trim()
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "protected-image";

  return `${safeBase}-veilshot.${format === "png" ? "png" : "jpg"}`;
}

async function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The image could not be loaded."));
    image.src = source;
  });
}

function clampRegion(annotation: Annotation, bounds: ImageBounds) {
  const x = Math.max(0, Math.min(annotation.x, bounds.width));
  const y = Math.max(0, Math.min(annotation.y, bounds.height));
  const width = Math.max(0, Math.min(annotation.width, bounds.width - x));
  const height = Math.max(0, Math.min(annotation.height, bounds.height - y));

  return { x, y, width, height };
}

function applyPixelation(
  context: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  region: { x: number; y: number; width: number; height: number },
  pixelSize: number,
): void {
  const source = document.createElement("canvas");
  source.width = Math.max(1, Math.round(region.width));
  source.height = Math.max(1, Math.round(region.height));
  const sourceContext = source.getContext("2d");
  if (!sourceContext) return;

  sourceContext.drawImage(
    sourceCanvas,
    region.x,
    region.y,
    region.width,
    region.height,
    0,
    0,
    source.width,
    source.height,
  );

  const blockSize = Math.max(4, Math.round(pixelSize));
  const reducedWidth = Math.max(1, Math.ceil(region.width / blockSize));
  const reducedHeight = Math.max(1, Math.ceil(region.height / blockSize));
  const reduced = document.createElement("canvas");
  reduced.width = reducedWidth;
  reduced.height = reducedHeight;
  const reducedContext = reduced.getContext("2d");
  if (!reducedContext) return;

  reducedContext.imageSmoothingEnabled = true;
  reducedContext.drawImage(source, 0, 0, reducedWidth, reducedHeight);

  context.save();
  context.imageSmoothingEnabled = false;
  context.drawImage(
    reduced,
    0,
    0,
    reducedWidth,
    reducedHeight,
    region.x,
    region.y,
    region.width,
    region.height,
  );
  context.restore();
}

function applyBlur(
  context: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  region: { x: number; y: number; width: number; height: number },
  blurStrength: number,
): void {
  const radius = Math.max(4, Math.round(blurStrength));
  const padding = radius * 2;
  const sourceX = Math.max(0, region.x - padding);
  const sourceY = Math.max(0, region.y - padding);
  const sourceWidth = Math.min(
    sourceCanvas.width - sourceX,
    region.width + padding * 2,
  );
  const sourceHeight = Math.min(
    sourceCanvas.height - sourceY,
    region.height + padding * 2,
  );

  const source = document.createElement("canvas");
  source.width = Math.max(1, Math.ceil(sourceWidth));
  source.height = Math.max(1, Math.ceil(sourceHeight));
  const sourceContext = source.getContext("2d");
  if (!sourceContext) return;

  sourceContext.drawImage(
    sourceCanvas,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    source.width,
    source.height,
  );

  context.save();
  context.beginPath();
  context.rect(region.x, region.y, region.width, region.height);
  context.clip();
  context.filter = `blur(${radius}px)`;
  context.drawImage(source, sourceX, sourceY, sourceWidth, sourceHeight);
  context.filter = "none";
  context.restore();
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("The protected image could not be generated."));
      },
      mimeType,
      quality,
    );
  });
}

async function convertBlobToPng(blob: Blob): Promise<Blob> {
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await loadImage(objectUrl);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable.");
    context.drawImage(image, 0, 0);
    return await canvasToBlob(canvas, "image/png");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
