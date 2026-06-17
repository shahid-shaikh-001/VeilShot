import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Code2, Lock, Shield } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "About",
  description: "About VeilShot and its privacy-first architecture.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#08080a] px-5 py-16 text-neutral-100 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-neutral-400 transition hover:bg-neutral-900 hover:text-white"
        >
          <ArrowLeft size={16} />
          Home
        </Link>

        <div className="mt-12 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 shadow-lg shadow-violet-950/50">
          <Shield size={25} />
        </div>

        <h1 className="mt-7 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          About VeilShot
        </h1>
        <p className="mt-6 text-lg leading-8 text-neutral-400">
          VeilShot is a browser-based screenshot privacy cleaner for blurring,
          pixelating, and permanently redacting private information before an
          image is shared.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
            <Lock className="text-emerald-400" size={22} />
            <h2 className="mt-4 text-lg font-semibold text-white">
              Privacy by architecture
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-400">
              Images are decoded, edited, and exported inside the browser. The
              application has no image-upload API or persistent storage.
            </p>
          </article>

          <article className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
            <Code2 className="text-violet-400" size={22} />
            <h2 className="mt-4 text-lg font-semibold text-white">
              Built with modern web tools
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-400">
              Next.js, TypeScript, React Konva, the Canvas API, and Tailwind CSS
              power the editor without a backend or paid service.
            </p>
          </article>
        </div>

        <section className="mt-12 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-white">Developer</h2>
          <p className="mt-3 text-neutral-300">{siteConfig.author.name}</p>
          <a
            href={`mailto:${siteConfig.author.email}`}
            className="mt-1 inline-block text-violet-300 underline decoration-violet-500/40 underline-offset-4 transition hover:text-violet-200"
          >
            {siteConfig.author.email}
          </a>
        </section>
      </div>
    </main>
  );
}
