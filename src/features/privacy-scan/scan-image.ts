import {
  createWorker,
  OEM,
  PSM,
  type Block,
  type LoggerMessage,
  type Worker,
} from "tesseract.js";

import { detectSensitiveData } from "@/features/privacy-scan/detect-sensitive-data";

import type {
  OcrBoundingBox,
  OcrLine,
  OcrWord,
  PrivacyScanError,
  PrivacyScanProgress,
  PrivacyScanResult,
} from "@/features/privacy-scan/privacy-scan.types";

import type { ImageBounds } from "@/types/editor";

interface ScanImageOptions {
  imageUrl: string;
  imageBounds: ImageBounds;
  onProgress?: (progress: PrivacyScanProgress) => void;
  signal?: AbortSignal;
}

const MAX_OCR_DIMENSION = 2400;

export class PrivacyScanException extends Error {
  readonly details: PrivacyScanError;

  constructor(details: PrivacyScanError) {
    super(details.message);

    this.name = "PrivacyScanException";
    this.details = details;
  }
}

export async function scanImageForSensitiveData({
  imageUrl,
  imageBounds,
  onProgress,
  signal,
}: ScanImageOptions): Promise<PrivacyScanResult> {
  if (!imageUrl || imageBounds.width <= 0 || imageBounds.height <= 0) {
    throw new PrivacyScanException({
      code: "NO_IMAGE",
      message: "Load an image before starting the privacy scan.",
    });
  }

  const startedAt = performance.now();

  let worker: Worker | null = null;
  let workerTerminated = false;
  let scanCancelled = signal?.aborted ?? false;

  const emitProgress = (
    status: PrivacyScanProgress["status"],
    message: string,
    progress: number,
  ) => {
    onProgress?.({
      status,
      message,
      progress: Math.max(0, Math.min(1, progress)),
    });
  };

  const terminateWorker = async () => {
    if (!worker || workerTerminated) {
      return;
    }

    workerTerminated = true;

    try {
      await worker.terminate();
    } catch {
      // The worker may already be terminating after cancellation.
    }
  };

  const handleAbort = () => {
    scanCancelled = true;
    void terminateWorker();
  };

  signal?.addEventListener("abort", handleAbort, {
    once: true,
  });

  try {
    throwIfCancelled(scanCancelled);

    emitProgress("loading", "Preparing image for local OCR…", 0.03);

    const preparedImage = await createOcrCanvas({
      imageUrl,
      imageBounds,
    });

    throwIfCancelled(scanCancelled);

    emitProgress("loading", "Loading the local OCR engine…", 0.08);

    try {
      worker = await createWorker("eng", OEM.LSTM_ONLY, {
        logger: (message: LoggerMessage) => {
          if (scanCancelled) {
            return;
          }

          if (
            message.status === "recognizing text" ||
            message.status.includes("recogniz")
          ) {
            emitProgress(
              "recognizing",
              "Scanning visible text for sensitive information…",
              0.15 + message.progress * 0.72,
            );

            return;
          }

          emitProgress(
            "loading",
            formatWorkerStatus(message.status),
            0.08 + message.progress * 0.08,
          );
        },

        errorHandler: () => {
          // Errors are handled by the surrounding try/catch.
        },
      });
    } catch {
      throw new PrivacyScanException({
        code: "OCR_INITIALIZATION_FAILED",
        message:
          "The local OCR engine could not be initialized. Check your connection and try again.",
      });
    }

    throwIfCancelled(scanCancelled);

    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SPARSE_TEXT,
      preserve_interword_spaces: "1",
      user_defined_dpi: "300",
    });

    emitProgress("recognizing", "Reading text from the image…", 0.15);

    const recognitionResult = await worker.recognize(
      preparedImage.canvas,
      {},
      {
        text: true,
        blocks: true,
      },
    );

    throwIfCancelled(scanCancelled);

    emitProgress(
      "detecting",
      "Checking recognized text for sensitive patterns…",
      0.9,
    );

    const lines = convertBlocksToLines({
      blocks: recognitionResult.data.blocks ?? [],
      scaleX: preparedImage.scaleX,
      scaleY: preparedImage.scaleY,
      imageBounds,
    });

    const recognizedText = recognitionResult.data.text.trim();

    if (!recognizedText && lines.length === 0) {
      throw new PrivacyScanException({
        code: "NO_TEXT_FOUND",
        message:
          "No readable text was detected. You can still protect the image manually.",
      });
    }

    const suggestions = detectSensitiveData(lines);

    emitProgress(
      "completed",
      suggestions.length > 0
        ? `${suggestions.length} possible sensitive ${
            suggestions.length === 1 ? "detail" : "details"
          } found.`
        : "No common sensitive-data patterns were found.",
      1,
    );

    return {
      recognizedText,
      suggestions,
      scannedAt: Date.now(),
      durationMs: Math.round(performance.now() - startedAt),
    };
  } catch (error) {
    if (scanCancelled || signal?.aborted) {
      throw new PrivacyScanException({
        code: "SCAN_CANCELLED",
        message: "The privacy scan was cancelled.",
      });
    }

    if (error instanceof PrivacyScanException) {
      throw error;
    }

    throw new PrivacyScanException({
      code: "OCR_RECOGNITION_FAILED",
      message:
        "VeilShot could not read this image. Try a clearer or higher-resolution screenshot.",
    });
  } finally {
    signal?.removeEventListener("abort", handleAbort);

    await terminateWorker();
  }
}

async function createOcrCanvas({
  imageUrl,
  imageBounds,
}: {
  imageUrl: string;
  imageBounds: ImageBounds;
}): Promise<{
  canvas: HTMLCanvasElement;
  scaleX: number;
  scaleY: number;
}> {
  const image = await loadBrowserImage(imageUrl);

  const longestSide = Math.max(imageBounds.width, imageBounds.height);

  const downscaleRatio =
    longestSide > MAX_OCR_DIMENSION ? MAX_OCR_DIMENSION / longestSide : 1;

  const canvasWidth = Math.max(
    1,
    Math.round(imageBounds.width * downscaleRatio),
  );

  const canvasHeight = Math.max(
    1,
    Math.round(imageBounds.height * downscaleRatio),
  );

  const canvas = document.createElement("canvas");

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const context = canvas.getContext("2d", {
    alpha: false,
    willReadFrequently: false,
  });

  if (!context) {
    throw new PrivacyScanException({
      code: "OCR_RECOGNITION_FAILED",
      message: "The browser could not prepare the image for scanning.",
    });
  }

  // White background improves OCR for transparent screenshots.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvasWidth, canvasHeight);

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  context.drawImage(image, 0, 0, canvasWidth, canvasHeight);

  return {
    canvas,
    scaleX: imageBounds.width / canvasWidth,
    scaleY: imageBounds.height / canvasHeight,
  };
}

async function loadBrowserImage(imageUrl: string): Promise<HTMLImageElement> {
  const image = new Image();

  image.decoding = "async";
  image.src = imageUrl;

  try {
    await image.decode();
  } catch {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();

      image.onerror = () =>
        reject(
          new PrivacyScanException({
            code: "OCR_RECOGNITION_FAILED",
            message: "The image could not be decoded for the privacy scan.",
          }),
        );
    });
  }

  return image;
}

function convertBlocksToLines({
  blocks,
  scaleX,
  scaleY,
  imageBounds,
}: {
  blocks: Block[];
  scaleX: number;
  scaleY: number;
  imageBounds: ImageBounds;
}): OcrLine[] {
  const lines: OcrLine[] = [];

  for (const block of blocks) {
    for (const paragraph of block.paragraphs ?? []) {
      for (const line of paragraph.lines ?? []) {
        const words: OcrWord[] = (line.words ?? [])
          .filter((word) => word.text.trim().length > 0)
          .map((word) => ({
            text: word.text.trim(),
            confidence: word.confidence,
            bbox: scaleBoundingBox({
              bbox: word.bbox,
              scaleX,
              scaleY,
              imageBounds,
            }),
          }));

        const text =
          words.length > 0
            ? words.map((word) => word.text).join(" ")
            : line.text.trim();

        if (!text) {
          continue;
        }

        lines.push({
          text,
          confidence: line.confidence,
          bbox: scaleBoundingBox({
            bbox: line.bbox,
            scaleX,
            scaleY,
            imageBounds,
          }),
          words,
        });
      }
    }
  }

  return lines;
}

function scaleBoundingBox({
  bbox,
  scaleX,
  scaleY,
  imageBounds,
}: {
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  scaleX: number;
  scaleY: number;
  imageBounds: ImageBounds;
}): OcrBoundingBox {
  return {
    x0: clamp(bbox.x0 * scaleX, 0, imageBounds.width),

    y0: clamp(bbox.y0 * scaleY, 0, imageBounds.height),

    x1: clamp(bbox.x1 * scaleX, 0, imageBounds.width),

    y1: clamp(bbox.y1 * scaleY, 0, imageBounds.height),
  };
}

function formatWorkerStatus(status: string): string {
  const normalized = status.replace(/_/g, " ").trim();

  if (!normalized) {
    return "Preparing the local OCR engine…";
  }

  return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}…`;
}

function throwIfCancelled(cancelled: boolean): void {
  if (!cancelled) {
    return;
  }

  throw new PrivacyScanException({
    code: "SCAN_CANCELLED",
    message: "The privacy scan was cancelled.",
  });
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
