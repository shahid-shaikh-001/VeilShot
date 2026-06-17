import type {
  OcrBoundingBox,
  OcrLine,
  OcrWord,
  PrivacySuggestion,
  SensitiveDataType,
} from "@/features/privacy-scan/privacy-scan.types";

interface DetectionRule {
  type: SensitiveDataType;
  label: string;
  pattern: RegExp;
  baseConfidence: number;
  validate?: (match: string, lineText: string) => boolean;
}

interface TextSpan {
  start: number;
  end: number;
  word: OcrWord;
}

interface RawDetection {
  type: SensitiveDataType;
  label: string;
  matchedText: string;
  confidence: number;
  start: number;
  end: number;
  bbox: OcrBoundingBox;
}

const detectionRules: DetectionRule[] = [
  {
    type: "email",
    label: "Email address",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    baseConfidence: 0.98,
  },

  {
    type: "url",
    label: "Web address",
    pattern: /\b(?:https?:\/\/|www\.)[^\s<>"'`]+/gi,
    baseConfidence: 0.96,
  },

  {
    type: "ip-address",
    label: "IP address",
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    baseConfidence: 0.94,
    validate: isValidIpv4Address,
  },

  {
    type: "payment-card",
    label: "Payment card number",
    pattern: /\b(?:\d[ -]?){13,19}\b/g,
    baseConfidence: 0.96,
    validate: (match) => {
      const digits = digitsOnly(match);

      return (
        digits.length >= 13 && digits.length <= 19 && passesLuhnCheck(digits)
      );
    },
  },

  {
    type: "upi-id",
    label: "UPI ID",
    pattern: /\b[A-Z0-9._-]{2,}@[A-Z][A-Z0-9.-]{1,}\b/gi,
    baseConfidence: 0.93,
    validate: (match) => {
      // Prevent normal email addresses from also
      // being reported as UPI IDs.
      return !/\.[A-Z]{2,}$/i.test(match);
    },
  },

  {
    type: "phone",
    label: "Phone number",
    pattern:
      /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,5}[\s.-]?\d{4,6}/g,
    baseConfidence: 0.88,
    validate: (match) => {
      const digits = digitsOnly(match);

      return digits.length >= 10 && digits.length <= 15;
    },
  },

  {
    type: "otp",
    label: "OTP or verification code",
    pattern: /\b\d{4,8}\b/g,
    baseConfidence: 0.9,
    validate: (_match, lineText) =>
      containsAny(lineText, [
        "otp",
        "one time password",
        "one-time password",
        "verification code",
        "security code",
        "login code",
        "authentication code",
        "confirm code",
        "passcode",
      ]),
  },

  {
    type: "api-key",
    label: "API key",
    pattern:
      /\b(?:sk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{20,}|AKIA[A-Z0-9]{16})\b/g,
    baseConfidence: 0.99,
  },

  {
    type: "access-token",
    label: "Access token",
    pattern: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
    baseConfidence: 0.99,
  },

  {
    type: "transaction-id",
    label: "Transaction or reference ID",
    pattern: /\b[A-Z0-9][A-Z0-9_-]{7,31}\b/gi,
    baseConfidence: 0.84,
    validate: (match, lineText) => {
      const hasContext = containsAny(lineText, [
        "transaction id",
        "transaction no",
        "transaction number",
        "reference id",
        "reference no",
        "reference number",
        "payment id",
        "payment reference",
        "order id",
        "utr",
        "txn id",
        "txn no",
        "ref id",
        "ref no",
      ]);

      const hasNumber = /\d/.test(match);
      const hasLetter = /[a-z]/i.test(match);

      return hasContext && hasNumber && (hasLetter || match.length >= 10);
    },
  },
];

const typePriority: Record<SensitiveDataType, number> = {
  "api-key": 100,
  "access-token": 95,
  "payment-card": 90,
  email: 85,
  "upi-id": 80,
  url: 75,
  "ip-address": 70,
  phone: 65,
  otp: 60,
  "transaction-id": 55,
};

/**
 * Detect likely sensitive data inside OCR lines.
 *
 * Suggestions use original image-space coordinates so they
 * can be converted directly into VeilShot annotations.
 */
export function detectSensitiveData(lines: OcrLine[]): PrivacySuggestion[] {
  const detections: RawDetection[] = [];

  for (const line of lines) {
    const indexedLine = createIndexedLine(line);

    if (!indexedLine.text.trim()) {
      continue;
    }

    for (const rule of detectionRules) {
      // RegExp instances with the global flag retain lastIndex.
      // Clone each rule before scanning a new line.
      const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);

      for (const match of indexedLine.text.matchAll(pattern)) {
        const matchedText = match[0]?.trim();
        const start = match.index;

        if (!matchedText || start === undefined || !matchedText.length) {
          continue;
        }

        if (rule.validate && !rule.validate(matchedText, indexedLine.text)) {
          continue;
        }

        const end = start + matchedText.length;

        const bbox = getMatchBoundingBox({
          line,
          spans: indexedLine.spans,
          start,
          end,
        });

        detections.push({
          type: rule.type,
          label: rule.label,
          matchedText,
          confidence: calculateConfidence(rule.baseConfidence, line.confidence),
          start,
          end,
          bbox,
        });
      }
    }
  }

  return removeDuplicateAndOverlappingDetections(detections).map(
    (detection) => ({
      id: createSuggestionId(),
      type: detection.type,
      label: detection.label,
      matchedText: detection.matchedText,
      confidence: detection.confidence,

      x: detection.bbox.x0,
      y: detection.bbox.y0,
      width: Math.max(1, detection.bbox.x1 - detection.bbox.x0),
      height: Math.max(1, detection.bbox.y1 - detection.bbox.y0),

      selected: true,
    }),
  );
}

function createIndexedLine(line: OcrLine): {
  text: string;
  spans: TextSpan[];
} {
  const usableWords = line.words.filter((word) => word.text.trim().length > 0);

  if (!usableWords.length) {
    return {
      text: line.text,
      spans: [],
    };
  }

  let text = "";
  const spans: TextSpan[] = [];

  for (const word of usableWords) {
    if (text.length > 0) {
      text += " ";
    }

    const start = text.length;
    text += word.text.trim();

    spans.push({
      start,
      end: text.length,
      word,
    });
  }

  return {
    text,
    spans,
  };
}

function getMatchBoundingBox({
  line,
  spans,
  start,
  end,
}: {
  line: OcrLine;
  spans: TextSpan[];
  start: number;
  end: number;
}): OcrBoundingBox {
  const matchingWords = spans
    .filter((span) => span.end > start && span.start < end)
    .map((span) => span.word);

  if (!matchingWords.length) {
    return addBoundingBoxPadding(line.bbox);
  }

  const bbox = matchingWords.reduce<OcrBoundingBox>(
    (result, word) => ({
      x0: Math.min(result.x0, word.bbox.x0),
      y0: Math.min(result.y0, word.bbox.y0),
      x1: Math.max(result.x1, word.bbox.x1),
      y1: Math.max(result.y1, word.bbox.y1),
    }),
    {
      x0: matchingWords[0].bbox.x0,
      y0: matchingWords[0].bbox.y0,
      x1: matchingWords[0].bbox.x1,
      y1: matchingWords[0].bbox.y1,
    },
  );

  return addBoundingBoxPadding(bbox);
}

function addBoundingBoxPadding(bbox: OcrBoundingBox): OcrBoundingBox {
  const width = Math.max(1, bbox.x1 - bbox.x0);
  const height = Math.max(1, bbox.y1 - bbox.y0);

  const horizontalPadding = Math.max(3, width * 0.025);

  const verticalPadding = Math.max(2, height * 0.12);

  return {
    x0: Math.max(0, bbox.x0 - horizontalPadding),
    y0: Math.max(0, bbox.y0 - verticalPadding),
    x1: bbox.x1 + horizontalPadding,
    y1: bbox.y1 + verticalPadding,
  };
}

function calculateConfidence(
  ruleConfidence: number,
  ocrConfidence: number,
): number {
  const normalizedOcrConfidence = Math.max(0, Math.min(1, ocrConfidence / 100));

  return Number(
    (ruleConfidence * (0.7 + normalizedOcrConfidence * 0.3)).toFixed(3),
  );
}

function removeDuplicateAndOverlappingDetections(
  detections: RawDetection[],
): RawDetection[] {
  const sorted = [...detections].sort((a, b) => {
    const priorityDifference = typePriority[b.type] - typePriority[a.type];

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return b.confidence - a.confidence;
  });

  const accepted: RawDetection[] = [];

  for (const candidate of sorted) {
    const duplicate = accepted.some((existing) => {
      const sameText =
        normalizeDetectionText(existing.matchedText) ===
        normalizeDetectionText(candidate.matchedText);

      const stronglyOverlapping =
        calculateOverlap(existing.bbox, candidate.bbox) >= 0.7;

      return sameText && stronglyOverlapping;
    });

    if (duplicate) {
      continue;
    }

    const conflictingHigherPriority = accepted.some((existing) => {
      const overlap = calculateOverlap(existing.bbox, candidate.bbox);

      return (
        overlap >= 0.82 &&
        typePriority[existing.type] > typePriority[candidate.type]
      );
    });

    if (!conflictingHigherPriority) {
      accepted.push(candidate);
    }
  }

  return accepted.sort((a, b) => {
    if (Math.abs(a.bbox.y0 - b.bbox.y0) > 8) {
      return a.bbox.y0 - b.bbox.y0;
    }

    return a.bbox.x0 - b.bbox.x0;
  });
}

function calculateOverlap(
  first: OcrBoundingBox,
  second: OcrBoundingBox,
): number {
  const intersectionWidth = Math.max(
    0,
    Math.min(first.x1, second.x1) - Math.max(first.x0, second.x0),
  );

  const intersectionHeight = Math.max(
    0,
    Math.min(first.y1, second.y1) - Math.max(first.y0, second.y0),
  );

  const intersectionArea = intersectionWidth * intersectionHeight;

  if (intersectionArea === 0) {
    return 0;
  }

  const firstArea =
    Math.max(1, first.x1 - first.x0) * Math.max(1, first.y1 - first.y0);

  const secondArea =
    Math.max(1, second.x1 - second.x0) * Math.max(1, second.y1 - second.y0);

  return intersectionArea / Math.min(firstArea, secondArea);
}

function isValidIpv4Address(value: string): boolean {
  const sections = value.split(".");

  return (
    sections.length === 4 &&
    sections.every((section) => {
      if (!/^\d{1,3}$/.test(section)) {
        return false;
      }

      const number = Number(section);

      return number >= 0 && number <= 255;
    })
  );
}

function passesLuhnCheck(value: string): boolean {
  let sum = 0;
  let doubleDigit = false;

  for (let index = value.length - 1; index >= 0; index -= 1) {
    let digit = Number(value[index]);

    if (doubleDigit) {
      digit *= 2;

      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    doubleDigit = !doubleDigit;
  }

  return sum % 10 === 0;
}

function containsAny(value: string, phrases: string[]): boolean {
  const normalizedValue = value.toLowerCase();

  return phrases.some((phrase) => normalizedValue.includes(phrase));
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function normalizeDetectionText(value: string): string {
  return value.toLowerCase().replace(/[\s._-]+/g, "");
}

function createSuggestionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `privacy-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
