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
    <main className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-slate-100">
        <Link href="/"><Logo /></Link>
        <Link href="/signup" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          Get started free →
        </Link>
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
        {submitted ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 mx-auto">
              <svg className="h-6 w-6 text-brand-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="mt-5 text-xl font-bold text-slate-900">Request received</h1>
            <p className="mt-2 text-sm text-slate-500">
              We&rsquo;ll be in touch within one business day to schedule your walkthrough.
            </p>
            <Link href="/" className="mt-6 inline-block text-sm font-medium text-brand-700 hover:underline">
              ← Back to home
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">Request a demo</h1>
            <p className="mt-2 text-sm text-slate-500">
              We&rsquo;ll show you how GreenTrack handles a real questionnaire end to end. Usually 20 minutes.
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
              <button type="submit" className="btn-primary w-full py-3 mt-2">
                Request demo
              </button>
            </form>
            <p className="mt-4 text-center text-xs text-slate-400">
              Rather sign up directly?{" "}
              <Link href="/signup" className="text-brand-700 hover:underline">
                Get started free
              </Link>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
