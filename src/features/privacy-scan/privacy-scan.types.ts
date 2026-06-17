export type SensitiveDataType =
  | "email"
  | "phone"
  | "otp"
  | "payment-card"
  | "upi-id"
  | "ip-address"
  | "url"
  | "api-key"
  | "access-token"
  | "transaction-id";

export type PrivacyScanStatus =
  | "idle"
  | "loading"
  | "recognizing"
  | "detecting"
  | "completed"
  | "error";

export interface OcrBoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OcrWord {
  text: string;
  confidence: number;
  bbox: OcrBoundingBox;
}

export interface OcrLine {
  text: string;
  confidence: number;
  bbox: OcrBoundingBox;
  words: OcrWord[];
}

export interface PrivacySuggestion {
  id: string;
  type: SensitiveDataType;
  label: string;
  matchedText: string;
  confidence: number;

  x: number;
  y: number;
  width: number;
  height: number;

  selected: boolean;
}

export interface PrivacyScanProgress {
  status: PrivacyScanStatus;
  message: string;
  progress: number;
}

export interface PrivacyScanResult {
  recognizedText: string;
  suggestions: PrivacySuggestion[];
  scannedAt: number;
  durationMs: number;
}

export interface PrivacyScanError {
  code:
    | "NO_IMAGE"
    | "OCR_INITIALIZATION_FAILED"
    | "OCR_RECOGNITION_FAILED"
    | "NO_TEXT_FOUND"
    | "SCAN_CANCELLED"
    | "UNKNOWN";

  message: string;
}
