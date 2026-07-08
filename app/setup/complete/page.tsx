import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui";
import { currentUser } from "@/lib/auth";

export default async function SetupComplete() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return (
    <main
      className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center"
      style={{ background: "var(--bg)" }}
    >
      <Logo />
      <div
        className="mt-8 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold"
        style={{ background: "var(--primary-tint)", color: "var(--primary)" }}
      >
        ✓
      </div>
      <h1 className="mt-4 text-2xl font-bold font-display" style={{ color: "var(--text)" }}>Setup complete</h1>
      <p className="mt-2" style={{ color: "var(--text-muted)" }}>One last onboarding step: a quick screening of which Scope 3 categories apply to you. Then we handle the rest.</p>
      <div className="mt-8 grid w-full grid-cols-3 gap-4">
        {["GHG Inventory Report", "Questionnaire Helper", "Audit Trail"].map((title) => (
          <div key={title} className="card py-4 text-center">
            <div className="mt-1 text-xs font-semibold" style={{ color: "var(--text)" }}>{title}</div>
          </div>
        ))}
      </div>
      <Link href="/scope3-screening?from=intake" className="btn btn-primary mt-10 px-8 py-3">Continue — Scope 3 Screening</Link>
      <Link href="/dashboard" className="mt-4 text-sm underline" style={{ color: "var(--text-muted)" }}>Skip to dashboard</Link>
    </main>
  );
}
