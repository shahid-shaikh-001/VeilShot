export const siteConfig = {
  name: "VeilShot",
  title: "VeilShot — Smart Screenshot Privacy Cleaner",
  tagline: "Hide sensitive information before you share.",
  description:
    "Blur, pixelate, and permanently redact sensitive information from screenshots directly in your browser.",
  author: {
    name: "Shahid Shaikh",
    email: "shahidshaikhofficial.7@gmail.com",
  },
  links: {
    digitalHeroes: "https://digitalheroesco.com",
    github: "",
    portfolio: "",
  },
  upload: {
    maximumFileSize: 15 * 1024 * 1024,
    maximumWidth: 12_000,
    maximumHeight: 12_000,
    acceptedMimeTypes: ["image/png", "image/jpeg", "image/webp"] as const,
  },
} as const;

export type SiteConfig = typeof siteConfig;
