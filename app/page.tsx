import Link from "next/link";
import { Logo } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default function Landing() {
  if (currentUser()) redirect("/dashboard");
  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-8 py-5">
        <Logo />
        <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-navy-900">
          Log in
        </Link>
      </header>
      <section className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-navy-900 sm:text-5xl">
          Answer your customer&rsquo;s ESG questionnaire in{" "}
          <span className="text-brand-600">days, not months</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-slate-600">
          GreenTrack connects to your existing systems, calculates your emissions, and generates a
          report your customer will accept.
        </p>
        <Link href="/signup" className="btn-primary mt-8 px-8 py-3 text-base">
          Get Started
        </Link>
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            ["📊", "GHG Inventory Report", "Audit-ready PDF covering Scope 1, 2, and 3"],
            ["🗂️", "Questionnaire Helper", "Your numbers mapped to CDP, EcoVadis, and Walmart"],
            ["🔍", "Audit Trail", "Every number traced to its source and method"],
          ].map(([icon, title, desc]) => (
            <div key={title} className="card text-center">
              <div className="text-2xl">{icon}</div>
              <div className="mt-2 font-semibold text-navy-900">{title}</div>
              <div className="mt-1 text-sm text-slate-500">{desc}</div>
            </div>
          ))}
        </div>
        <p className="mt-12 text-sm text-slate-400">
          I am an ESG consultant —{" "}
          <Link href="/signup?role=consultant" className="underline hover:text-slate-600">
            sign up for the consultant platform
          </Link>
        </p>
      </section>
    </main>
  );
}
