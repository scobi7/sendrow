import Link from "next/link";
import { LandingNav } from "@/components/landing-nav";
import { LandingFooter } from "@/components/landing-footer";

export default function AgencySubmittedPage() {
  return (
    <>
      <LandingNav />
      <main className="mx-auto max-w-xl px-6 py-32 text-center">
        <div
          className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: "var(--primary-tint)" }}
        >
          <svg className="h-7 w-7" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="text-3xl font-black font-display" style={{ color: "var(--text)" }}>
          Got it — thanks
        </h1>
        <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
          We received your quote request and will get back to you within one business day. In the meantime, feel free to look around.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/for-consultants" className="btn btn-primary px-6">
            See the consultant platform
          </Link>
          <Link href="/" className="btn btn-secondary px-6">
            Back to home
          </Link>
        </div>
      </main>
      <LandingFooter />
    </>
  );
}
