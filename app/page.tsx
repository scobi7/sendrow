import Link from "next/link";
import { Logo } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Landing() {
  if (await currentUser()) redirect("/dashboard");
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <header className="flex items-center justify-between border-b border-zinc-100 px-8 py-4">
        <Logo />
        <Link href="/login" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
          Log in
        </Link>
      </header>

      <section className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center px-6 pb-24 pt-16 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          ESG compliance for California companies
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl sm:leading-tight">
          Answer your customer&rsquo;s ESG{" "}
          <br className="hidden sm:block" />
          questionnaire in{" "}
          <span className="text-brand-600">days, not months</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-zinc-500">
          GreenTrack connects to your existing systems, calculates your emissions, and generates a
          report your customer will accept.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link href="/signup" className="btn-primary px-8 py-3 text-base shadow-md hover:shadow-lg">
            Get Started — it&rsquo;s free
          </Link>
          <a href="/api/demo" className="text-sm font-medium text-zinc-400 hover:text-zinc-700 transition-colors">
            View demo company →
          </a>
        </div>

        <div className="mt-16 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              icon: "📊",
              title: "GHG Inventory Report",
              desc: "Audit-ready PDF covering Scope 1, 2, and 3 — in GHG Protocol format",
            },
            {
              icon: "🗂️",
              title: "Questionnaire Helper",
              desc: "Your numbers mapped to CDP, EcoVadis, and Walmart field by field",
            },
            {
              icon: "🔍",
              title: "Audit Trail",
              desc: "Every number traced to its source, factor, and calculation",
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="card text-left">
              <div className="mb-3 text-2xl">{icon}</div>
              <div className="font-semibold text-zinc-900">{title}</div>
              <div className="mt-1 text-sm leading-relaxed text-zinc-500">{desc}</div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm text-zinc-400">
          I am an ESG consultant —{" "}
          <span className="cursor-not-allowed underline decoration-dotted" title="Consultant platform: coming in the next build phase">
            consultant platform coming soon
          </span>
        </p>
      </section>
    </main>
  );
}
