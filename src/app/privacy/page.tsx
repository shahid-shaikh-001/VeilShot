import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How VeilShot processes screenshots locally and protects image privacy.",
};

const commitments = [
  "Images are not uploaded to a VeilShot server.",
  "No account, cookie, database, or image history is required.",
  "Image pixels and redaction coordinates are not sent to analytics.",
  "Temporary object URLs are released when the image is replaced or removed.",
  "The exported file is newly rendered and flattened in the browser.",
];

export default function PrivacyPage() {
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

        <div className="mt-12 flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
            <ShieldCheck size={27} />
          </span>
          <div>
            <p className="text-sm font-medium text-emerald-300">
              Local by design
            </p>
            <h1 className="mt-1 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Privacy policy
            </h1>
          </div>
        </div>

        <p className="mt-8 text-lg leading-8 text-neutral-400">
          VeilShot processes supported images entirely in the browser. The
          application does not provide a server endpoint for uploading or
          storing screenshots.
        </p>

        <section className="mt-10 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-white">
            What VeilShot does
          </h2>
          <ul className="mt-5 space-y-4">
            {commitments.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm leading-6 text-neutral-300"
              >
                <CheckCircle2
                  className="mt-0.5 shrink-0 text-emerald-400"
                  size={18}
                />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-white">
            Temporary browser memory
          </h2>
          <p className="mt-3 text-sm leading-7 text-neutral-400">
            While editing, the browser temporarily holds the selected File,
            decoded image data, canvas pixels, region coordinates, and export
            Blob. This data is removed when you reset the editor, replace the
            image, close the tab, or refresh the page.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <TriangleAlert
              className="mt-0.5 shrink-0 text-amber-300"
              size={20}
            />
            <div>
              <h2 className="font-semibold text-amber-100">
                Review is required
              </h2>
              <p className="mt-2 text-sm leading-6 text-amber-100/75">
                Blur and pixelation can leave contextual clues. Use solid
                redaction for highly sensitive information and inspect the full
                exported image before sharing it.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
