import Link from "next/link";
import { Logo } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Landing() {
  const user = await currentUser();
  if (user) redirect(user.role === "consultant" ? "/consultant" : "/dashboard");

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-slate-100">
        <Logo />
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Log in
          </Link>
          <Link href="/signup" className="btn-primary text-sm px-4 py-2">
            Get Started
          </Link>
        </div>
      </header>
      <section className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700 mb-6 border border-emerald-200">
          Built for California mid-market companies
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Answer your customer&rsquo;s ESG questionnaire in{" "}
          <span className="text-emerald-600">days, not months</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-slate-600">
          GreenTrack connects to your existing systems, calculates your emissions, and generates a
          report your customer will accept — CDP, EcoVadis, Walmart, and more.
        </p>
        <div className="mt-8 flex items-center gap-4">
          <Link href="/signup" className="btn-primary px-8 py-3 text-base">
            Get Started Free
          </Link>
          <Link href="/signup?role=consultant" className="text-sm font-medium text-slate-500 hover:text-slate-700">
            ESG Consultant? →
          </Link>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            ["📊", "GHG Inventory Report", "Audit-ready PDF covering Scope 1, 2, and 3 emissions"],
            ["🗂️", "Questionnaire Helper", "Your numbers mapped to CDP, EcoVadis, and Walmart"],
            ["🔍", "Audit Trail", "Every number traced to its source and calculation method"],
          ].map(([icon, title, desc]) => (
            <div key={title} className="card text-center bg-white">
              <div className="text-2xl">{icon}</div>
              <div className="mt-2 font-semibold text-slate-900">{title}</div>
              <div className="mt-1 text-sm text-slate-500">{desc}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
