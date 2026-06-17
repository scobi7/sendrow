export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Logo } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import { onboardAsCompany, onboardAsConsultant } from "@/lib/actions";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { userId } = await auth();
  if (!userId) redirect("/login");
  const user = await currentUser();
  if (user?.companyId) redirect("/dashboard");

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{ background: "var(--bg)" }}
    >
      <Logo />
      <div className="mt-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold font-display" style={{ color: "var(--text)" }}>
          Welcome to GreenTrack
        </h1>
        <p className="mt-2" style={{ color: "var(--text-muted)" }}>How will you be using GreenTrack?</p>

        {error && (
          <p
            className="mt-4 rounded-lg px-4 py-3 text-sm"
            style={{ background: "var(--danger-tint)", color: "var(--danger)" }}
          >
            {error}
          </p>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="card">
            <div className="text-2xl">🏢</div>
            <h2 className="mt-3 font-bold font-display" style={{ color: "var(--text)" }}>I represent a company</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Build your GHG inventory, track ESG metrics, and generate reports for customer questionnaires.
            </p>
            <form action={onboardAsCompany} className="mt-5 space-y-3">
              <div>
                <label className="label">Company name</label>
                <input
                  name="company"
                  required
                  className="input"
                  placeholder="Pacific Coast Logistics"
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary w-full">Get Started</button>
            </form>
          </div>

          <div className="card">
            <div className="text-2xl">🌿</div>
            <h2 className="mt-3 font-bold font-display" style={{ color: "var(--text)" }}>I am an ESG consultant</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Manage multiple client companies, track their progress, and generate invite links for them to fill in data.
            </p>
            <form action={onboardAsConsultant} className="mt-5">
              <button type="submit" className="btn btn-primary w-full">Set up Consultant Account</button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
