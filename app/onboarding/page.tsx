export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Logo } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
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
          How will you use Sendrow?
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
          <h2 className="font-bold font-display" style={{ color: "var(--text)" }}>I&rsquo;m a climate consultant</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Manage client companies, request data through secure portals, and produce
            audit-ready inventories under your own brand.
          </p>
          <form action={onboardAsConsultant} className="mt-5">
            <SubmitButton className="btn btn-primary w-full" pendingText="Setting up...">Set up Consultant Account</SubmitButton>
          </form>
        </div>

        <div className="card mt-4">
          <h2 className="font-bold font-display" style={{ color: "var(--text)" }}>I&rsquo;m a company, supplier or other third party</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            You don&rsquo;t need an account. When your consultant needs data from you, they send you a secure link for that request, and you upload or type everything there.
          </p>
          <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
            Lost your link? Ask your consultant to resend it.
          </p>
          <Link href="/get-matched" className="btn btn-secondary mt-5 w-full">
            Don&rsquo;t have a consultant? Get matched
          </Link>
        </div>
      </div>
    </main>
  );
}
