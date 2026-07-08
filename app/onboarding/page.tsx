export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Logo } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import { onboardAsConsultant } from "@/lib/actions";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { userId } = await auth();
  if (!userId) redirect("/login");
  const user = await currentUser();
  if (user?.role === "consultant") redirect("/consultant");

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{ background: "var(--bg)" }}
    >
      <Logo />
      <div className="mt-8 w-full max-w-md">
        <h1 className="text-2xl font-bold font-display" style={{ color: "var(--text)" }}>
          Welcome to Sendrow
        </h1>
        <p className="mt-2" style={{ color: "var(--text-muted)" }}>
          Set up your consultant workspace.
        </p>

        {error && (
          <p
            className="mt-4 rounded-lg px-4 py-3 text-sm"
            style={{ background: "var(--danger-tint)", color: "var(--danger)" }}
          >
            {error}
          </p>
        )}

        <div className="card mt-6">
          <h2 className="font-bold font-display" style={{ color: "var(--text)" }}>I am a climate consultant</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Manage client companies, request data through secure portals, and produce
            audit-ready inventories under your own brand.
          </p>
          <form action={onboardAsConsultant} className="mt-5">
            <button type="submit" className="btn btn-primary w-full">Set up Consultant Account</button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Represent a company?{" "}
          <Link href="/get-matched" className="font-medium underline" style={{ color: "var(--primary)" }}>
            Get matched with a climate consultant →
          </Link>
        </p>
      </div>
    </main>
  );
}
