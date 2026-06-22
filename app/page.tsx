import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui";

export default async function Home() {
  const user = await currentUser();
  if (user) redirect(user.role === "consultant" ? "/consultant" : "/dashboard");

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-8 py-5"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--divider)" }}
      >
        <Logo />
        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            Sign in
          </Link>
          <Link href="/demo" className="btn btn-primary text-sm px-4 py-2">
            Request a demo
          </Link>
        </div>
      </header>

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute left-1/2 top-0 -translate-x-1/2"
          style={{
            width: 900,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(34,197,94,0.1) 0%, transparent 65%)",
          }}
        />
      </div>

      {/* Main */}
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <h1
          className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
          style={{ color: "var(--text)" }}
        >
          ESG compliance,
          <br />
          <span style={{ color: "var(--primary)" }}>done right.</span>
        </h1>
        <p
          className="mx-auto mt-5 max-w-lg text-base leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          Whether you&rsquo;re filing your first report or managing a book of clients, GreenTrack handles the data work so you can focus on what matters.
        </p>

        <div className="mt-14 grid w-full max-w-2xl gap-4 sm:grid-cols-2">
          <Link
            href="/for-companies"
            className="group rounded-2xl p-8 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{
              background: "var(--card)",
              border: "1px solid var(--divider)",
              boxShadow: "0 1px 4px rgba(15,50,28,0.05)",
            }}
          >
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--primary)" }}
            >
              For companies
            </p>
            <h2
              className="mt-3 font-display text-lg font-bold leading-snug"
              style={{ color: "var(--text)" }}
            >
              Got an ESG questionnaire from a customer?
            </h2>
            <p
              className="mt-2 text-sm leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              Connect your accounts. We calculate your footprint and map your numbers to whatever framework they&rsquo;re asking for.
            </p>
            <span
              className="mt-6 inline-flex items-center gap-1 text-sm font-semibold"
              style={{ color: "var(--primary)" }}
            >
              See how it works &rarr;
            </span>
          </Link>

          <Link
            href="/for-consultants"
            className="group rounded-2xl p-8 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{
              background: "var(--card)",
              border: "1px solid var(--divider)",
              boxShadow: "0 1px 4px rgba(15,50,28,0.05)",
            }}
          >
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--primary)" }}
            >
              For consultants
            </p>
            <h2
              className="mt-3 font-display text-lg font-bold leading-snug"
              style={{ color: "var(--text)" }}
            >
              Managing clients across spreadsheets?
            </h2>
            <p
              className="mt-2 text-sm leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              Run your entire book from one platform. Clients connect their own accounts. You review, report, and deliver.
            </p>
            <span
              className="mt-6 inline-flex items-center gap-1 text-sm font-semibold"
              style={{ color: "var(--primary)" }}
            >
              See how it works &rarr;
            </span>
          </Link>
        </div>

        <p className="mt-8 text-xs" style={{ color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link href="/login" className="underline" style={{ color: "var(--primary)" }}>
            Sign in
          </Link>
        </p>
      </div>

      {/* Footer */}
      <footer className="px-6 py-8" style={{ background: "var(--text)" }}>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-6">
          <span className="flex items-center gap-2 font-display text-base font-bold text-white">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black"
              style={{ background: "var(--status-green)", color: "var(--text)" }}
            >
              G
            </span>
            GreenTrack
          </span>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            &copy; {new Date().getFullYear()} GreenTrack. Built in California.
          </p>
          <div className="flex gap-6">
            {[
              ["Sign in", "/login"],
              ["Request demo", "/demo"],
              ["Get started", "/signup"],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="text-xs transition-opacity hover:opacity-80"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
