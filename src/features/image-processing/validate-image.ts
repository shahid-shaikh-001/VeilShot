import { siteConfig } from "@/lib/site-config";
import type { ImageBounds } from "@/types/editor";

export interface ValidatedImage {
  objectUrl: string;
  bounds: ImageBounds;
}

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageValidationError";
  }
}

export async function validateImageFile(file: File): Promise<ValidatedImage> {
  const acceptedTypes = new Set<string>(siteConfig.upload.acceptedMimeTypes);

  if (!acceptedTypes.has(file.type)) {
    throw new ImageValidationError(
      "Unsupported format. Upload a PNG, JPG, or WebP image.",
    );
  }

  if (file.size === 0) {
    throw new ImageValidationError("This file is empty and cannot be opened.");
  }

  if (file.size > siteConfig.upload.maximumFileSize) {
    throw new ImageValidationError("This image exceeds the 15 MB limit.");
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const bounds = await decodeImageDimensions(objectUrl);

    if (
      bounds.width > siteConfig.upload.maximumWidth ||
      bounds.height > siteConfig.upload.maximumHeight
    ) {
      throw new ImageValidationError(
        "This image is too large for safe browser processing. Maximum dimensions are 12,000 × 12,000 pixels.",
      );
    }

    return { objectUrl, bounds };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error instanceof ImageValidationError
      ? error
      : new ImageValidationError(
          "This image could not be decoded. Try exporting it again as PNG or JPG.",
        );
  }
}

function decodeImageDimensions(objectUrl: string): Promise<ImageBounds> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      if (!image.naturalWidth || !image.naturalHeight) {
        reject(new ImageValidationError("The image has invalid dimensions."));
        return;
      }

      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };

    image.onerror = () => reject(new Error("Image decode failed"));
    image.src = objectUrl;
  });
}
