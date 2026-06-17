import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Eye,
  FileDown,
  Lock,
  MousePointer2,
  Shield,
  Sparkles,
  Upload,
} from "lucide-react";

import { siteConfig } from "@/lib/site-config";

const features = [
  {
    icon: Eye,
    title: "Smart Blur",
    description: "Quickly obscure text, numbers, and personal information.",
  },
  {
    icon: Sparkles,
    title: "Pixelate",
    description: "Hide faces, usernames, and other identifying details.",
  },
  {
    icon: Shield,
    title: "Solid Redact",
    description: "Permanently cover highly sensitive areas of an image.",
  },
  {
    icon: Download,
    title: "Local Export",
    description: "Download the protected image without uploading it anywhere.",
  },
];

const steps = [
  {
    icon: Upload,
    number: "01",
    title: "Upload your screenshot",
    description: "Choose a PNG, JPG, or WebP image directly from your device.",
  },
  {
    icon: MousePointer2,
    number: "02",
    title: "Select private areas",
    description:
      "Draw regions over names, messages, photos, numbers, or other sensitive details.",
  },
  {
    icon: FileDown,
    number: "03",
    title: "Download the safe copy",
    description:
      "Preview the protected result and export it in full resolution.",
  },
];

const useCases = [
  "Payment receipts",
  "Private conversations",
  "Application forms",
  "Support screenshots",
  "Developer logs",
  "Social media posts",
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-950 text-neutral-100">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-12rem] left-1/2 h-[34rem] w-[56rem] -translate-x-1/2 rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="absolute top-[42rem] -right-64 h-[34rem] w-[34rem] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      {/* Hero */}
      <section className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-4 pt-20 text-center sm:pt-28 lg:pt-32">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm font-medium text-violet-300 backdrop-blur-md">
          <Lock size={14} aria-hidden="true" />
          <span>100% client-side processing</span>
        </div>

        <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
          Hide sensitive information with{" "}
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
            confidence
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-400 sm:text-xl">
          {siteConfig.description}
        </p>

        <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/editor"
            className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-bold text-neutral-950 transition hover:bg-neutral-200"
          >
            Open Editor
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>

          <a
            href={siteConfig.links.digitalHeroes}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-13 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900/60 px-8 text-base font-semibold text-neutral-300 transition hover:border-neutral-700 hover:bg-neutral-800"
          >
            Built for Digital Heroes
          </a>
        </div>

        <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-neutral-500">
          {["No account", "No paid API", "No image storage"].map((item) => (
            <span key={item} className="flex items-center gap-2">
              <CheckCircle2
                size={15}
                className="text-emerald-400"
                aria-hidden="true"
              />
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-20 pb-24 sm:px-8"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 backdrop-blur-sm transition hover:border-neutral-700 hover:bg-neutral-900/70"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                  <Icon size={23} aria-hidden="true" />
                </div>

                <h2 className="mt-5 text-lg font-semibold text-neutral-100">
                  {feature.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-neutral-400">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="relative z-10 border-y border-neutral-900 bg-neutral-900/25"
      >
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-[0.14em] text-violet-400 uppercase">
              How it works
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Protect a screenshot in three steps
            </h2>

            <p className="mt-4 leading-7 text-neutral-400">
              No account, complicated setup, or cloud upload is required.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <article
                  key={step.number}
                  className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                      <Icon size={20} aria-hidden="true" />
                    </span>

                    <span className="text-sm font-semibold text-neutral-700">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>

                  <p className="mt-3 text-sm leading-6 text-neutral-400">
                    {step.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 py-20 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold tracking-[0.14em] text-violet-400 uppercase">
              Useful anywhere
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Built for screenshots you share every day
            </h2>

            <p className="mt-4 max-w-lg leading-7 text-neutral-400">
              VeilShot helps remove private information before an image is
              posted, sent to support, shared with colleagues, or published
              online.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {useCases.map((useCase) => (
              <div
                key={useCase}
                className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/40 px-4 py-4"
              >
                <CheckCircle2
                  size={18}
                  className="shrink-0 text-violet-400"
                  aria-hidden="true"
                />

                <span className="text-sm font-medium text-neutral-300">
                  {useCase}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-20 sm:px-8">
        <div className="grid items-center gap-8 rounded-3xl border border-violet-500/20 bg-violet-500/[0.07] p-7 sm:p-10 lg:grid-cols-[1fr_auto]">
          <div className="max-w-3xl">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
              <Lock size={20} aria-hidden="true" />
            </span>

            <h2 className="mt-6 text-2xl font-bold sm:text-3xl">
              Your image stays on your device
            </h2>

            <p className="mt-3 max-w-2xl leading-7 text-neutral-400">
              VeilShot performs editing and export locally in your browser.
              Images are not sent to an application server or stored in a
              database.
            </p>
          </div>

          <Link
            href="/privacy"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-violet-400/25 bg-violet-500/10 px-6 font-semibold text-violet-200 transition hover:bg-violet-500/20"
          >
            Read Privacy Policy
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 border-t border-neutral-900 bg-neutral-900/20">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-8">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
            <Shield size={220} aria-hidden="true" />
          </span>

          <h2 className="mx-auto mt-6 max-w-4xl text-3xl font-bold tracking-tight sm:text-4xl">
            Make your screenshot safe before sharing it
          </h2>

          <p className="mx-auto mt-4 max-w-xl leading-7 text-neutral-400">
            Upload an image, protect sensitive areas, and download the final
            result in a few minutes.
          </p>

          <Link
            href="/editor"
            className="group mt-8 inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-white px-8 font-bold text-neutral-950 transition hover:bg-neutral-200"
          >
            Start Protecting
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-neutral-900 bg-neutral-950">
        <div className="mx-auto flex max-w-6xl flex-col gap-7 px-4 py-9 sm:px-8 md:flex-row md:items-center">
          <div>
            <p className="mt-3 text-sm text-neutral-500">
              Built by {siteConfig.author.name}
            </p>

            <a
              href={`mailto:${siteConfig.author.email}`}
              className="mt-1 inline-block text-sm text-neutral-400 transition hover:text-white"
            >
              {siteConfig.author.email}
            </a>
          </div>

          <nav className="flex flex-wrap gap-6 text-sm text-neutral-500 md:ml-auto">
            <Link href="/editor" className="transition hover:text-white">
              Editor
            </Link>

            <Link href="/privacy" className="transition hover:text-white">
              Privacy
            </Link>

            <Link href="/about" className="transition hover:text-white">
              About
            </Link>

            <a
              href={siteConfig.links.digitalHeroes}
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-white"
            >
              Digital Heroes
            </a>
          </nav>
        </div>

        <div className="border-t border-neutral-900">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-neutral-600 sm:flex-row sm:px-8">
            <span>© 2026 VeilShot</span>

            <span className="sm:ml-auto">
              Built locally. Processed locally. Stays locally.
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
