import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createCheckoutSession } from "@/lib/stripe";
import { currentUser } from "@/lib/auth";
import { Logo } from "@/components/ui";
import Link from "next/link";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; cancelled?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const { plan, cancelled } = await searchParams;

  if (plan === "company" || plan === "consultant") {
    const user = await currentUser();
    const session = await createCheckoutSession(userId, plan, user?.email ?? undefined);
    redirect(session.url!);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6" style={{ background: "var(--bg)" }}>
      <Logo />
      <div className="mt-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold font-display" style={{ color: "var(--text)" }}>
          Choose your plan
        </h1>
        <p className="mt-2" style={{ color: "var(--text-muted)" }}>
          {cancelled ? "Your payment was cancelled. Ready to try again?" : "Select the plan that fits how you use Sendrow."}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link
            href="/checkout?plan=company"
            className="card block hover:border-[var(--primary)] transition-colors"
            style={{ border: "1px solid var(--divider)" }}
          >
            <h2 className="font-bold font-display" style={{ color: "var(--text)" }}>Company</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Build your GHG inventory and generate reports.
            </p>
            <p className="mt-3 text-xl font-black font-data" style={{ color: "var(--text)" }}>$400 <span className="text-sm font-normal" style={{ color: "var(--text-muted)" }}>/ report</span></p>
          </Link>

          <Link
            href="/checkout?plan=consultant"
            className="card block hover:border-[var(--primary)] transition-colors"
            style={{ border: "2px solid var(--primary)" }}
          >
            <h2 className="font-bold font-display" style={{ color: "var(--text)" }}>Consultant</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Manage multiple client companies from one dashboard.
            </p>
            <p className="mt-3 text-xl font-black font-data" style={{ color: "var(--text)" }}>$300 <span className="text-sm font-normal" style={{ color: "var(--text-muted)" }}>/ mo</span></p>
          </Link>
        </div>
      </div>
    </main>
  );
}
