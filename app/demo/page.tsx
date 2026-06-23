export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui";
import { sendDemoRequest } from "@/lib/email";

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { submitted } = await searchParams;

  async function requestDemo(formData: FormData) {
    "use server";
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const company = String(formData.get("company") ?? "").trim();
    if (!name || !email || !company) redirect("/demo?error=1");
    await sendDemoRequest(name, email, company);
    redirect("/demo?submitted=1");
  }

  return (
    <main className="flex min-h-screen flex-col" style={{ background: "var(--bg)" }}>
      <header
        className="flex items-center justify-between px-8 py-5"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--divider)" }}
      >
        <Link href="/"><Logo /></Link>
        <Link
          href="/signup"
          className="text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: "var(--text-muted)" }}
        >
          Get started free →
        </Link>
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
        {submitted ? (
          <div className="card text-center">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full mx-auto"
              style={{ background: "var(--primary-tint)" }}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ color: "var(--primary)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="mt-5 text-xl font-bold font-display" style={{ color: "var(--text)" }}>Request received</h1>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              We&rsquo;ll be in touch shortly. Or pick a time right now:
            </p>
            <a
              href="https://calendly.com/malachinguyenn/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary mt-6 inline-block text-sm px-6 py-2.5"
            >
              Book a time →
            </a>
            <div className="mt-4">
              <Link href="/" className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: "var(--text-muted)" }}>
                ← Back to home
              </Link>
            </div>
          </div>
        ) : (
          <div className="card">
            <h1 className="text-2xl font-bold font-display" style={{ color: "var(--text)" }}>Request a demo</h1>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              We&rsquo;ll show you how Sendrow handles a real questionnaire end to end. Usually 20 minutes.
            </p>
            <form action={requestDemo} className="mt-8 space-y-4">
              <div>
                <label className="label">Your name</label>
                <input name="name" required className="input" placeholder="Alex Johnson" />
              </div>
              <div>
                <label className="label">Work email</label>
                <input name="email" type="email" required className="input" placeholder="alex@company.com" />
              </div>
              <div>
                <label className="label">Company name</label>
                <input name="company" required className="input" placeholder="Pacific Coast Logistics" />
              </div>
              <button type="submit" className="btn btn-primary w-full py-3 mt-2">
                Request demo
              </button>
            </form>
            <p className="mt-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
              Prefer to pick a time directly?{" "}
              <a
                href="https://calendly.com/malachinguyenn/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="underline transition-opacity hover:opacity-70"
                style={{ color: "var(--primary)" }}
              >
                Book on Calendly
              </a>
            </p>
            <p className="mt-2 text-center text-xs" style={{ color: "var(--text-muted)" }}>
              Rather sign up directly?{" "}
              <Link href="/signup" className="underline transition-opacity hover:opacity-70" style={{ color: "var(--primary)" }}>
                Get started free
              </Link>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
