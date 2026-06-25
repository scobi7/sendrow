import { redirect } from "next/navigation";
import Link from "next/link";
import { LandingNav } from "@/components/landing-nav";
import { sendAgencyQuoteRequest } from "@/lib/email";
import { clientIp, checkRateLimit } from "@/lib/ratelimit";

async function submitQuote(formData: FormData) {
  "use server";
  const ip = await clientIp();
  if (!checkRateLimit(`agency_quote:${ip}`)) redirect("/pricing/agency?error=rate_limit");

  const get = (k: string) => (formData.get(k) as string | null) ?? "";
  const getAll = (k: string) => formData.getAll(k) as string[];

  await sendAgencyQuoteRequest({
    name: get("name"),
    email: get("email"),
    firm: get("firm"),
    title: get("title"),
    teamSize: get("team_size"),
    clientCount: get("client_count"),
    workTypes: getAll("work_types"),
    frameworks: getAll("frameworks"),
    currentTools: get("current_tools"),
    painPoint: get("pain_point"),
    timeline: get("timeline"),
    source: get("source"),
  });

  redirect("/pricing/agency/submitted");
}

const WORK_TYPES = [
  "GHG / Carbon inventory",
  "EcoVadis preparation",
  "CDP filing",
  "GRESB (real estate)",
  "Supply chain questionnaire support",
  "Sustainability strategy",
  "Net zero / decarbonization planning",
  "Regulatory compliance (CSRD, SEC)",
];

const FRAMEWORKS = [
  "GHG Protocol",
  "GRI",
  "TCFD",
  "SASB",
  "CSRD",
  "Science Based Targets (SBTi)",
];

export default function AgencyQuotePage() {
  return (
    <>
      <LandingNav />
      <main className="mx-auto max-w-2xl px-6 py-20">

        <Link
          href="/pricing"
          className="mb-8 inline-block text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: "var(--primary)" }}
        >
          ← Back to pricing
        </Link>

        <h1 className="text-3xl font-black font-display tracking-tight" style={{ color: "var(--text)" }}>
          Get a quote for your agency
        </h1>
        <p className="mt-3 text-base" style={{ color: "var(--text-muted)" }}>
          Tell us about your team and client book. We'll put together a custom plan and get back to you within one business day.
        </p>

        <form action={submitQuote} className="mt-10 space-y-8">

          {/* Contact */}
          <section>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Contact</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Your name *</label>
                <input name="name" type="text" required className="input w-full" placeholder="Jane Smith" />
              </div>
              <div>
                <label className="label">Work email *</label>
                <input name="email" type="email" required className="input w-full" placeholder="jane@verdani.com" />
              </div>
              <div>
                <label className="label">Firm name *</label>
                <input name="firm" type="text" required className="input w-full" placeholder="Verdani Partners" />
              </div>
              <div>
                <label className="label">Your title</label>
                <input name="title" type="text" className="input w-full" placeholder="Director of Sustainability" />
              </div>
            </div>
          </section>

          {/* Team */}
          <section>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Your team</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Number of sustainability consultants *</label>
                <select name="team_size" required className="input w-full">
                  <option value="">Select…</option>
                  <option value="2–5">2–5</option>
                  <option value="6–10">6–10</option>
                  <option value="11–25">11–25</option>
                  <option value="26–50">26–50</option>
                  <option value="50+">50+</option>
                </select>
              </div>
              <div>
                <label className="label">Active clients right now *</label>
                <select name="client_count" required className="input w-full">
                  <option value="">Select…</option>
                  <option value="Under 10">Under 10</option>
                  <option value="10–25">10–25</option>
                  <option value="26–50">26–50</option>
                  <option value="51–100">51–100</option>
                  <option value="100+">100+</option>
                </select>
              </div>
            </div>
          </section>

          {/* Work types */}
          <section>
            <h2 className="mb-1 text-sm font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>What work do you do?</h2>
            <p className="mb-4 text-xs" style={{ color: "var(--text-muted)" }}>Select all that apply.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {WORK_TYPES.map((w) => (
                <label key={w} className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm cursor-pointer transition-colors hover:bg-gray-50" style={{ border: "1px solid var(--divider)" }}>
                  <input type="checkbox" name="work_types" value={w} className="accent-green-600" />
                  <span style={{ color: "var(--text)" }}>{w}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Frameworks */}
          <section>
            <h2 className="mb-1 text-sm font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Frameworks you work with</h2>
            <p className="mb-4 text-xs" style={{ color: "var(--text-muted)" }}>Select all that apply.</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {FRAMEWORKS.map((f) => (
                <label key={f} className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm cursor-pointer transition-colors hover:bg-gray-50" style={{ border: "1px solid var(--divider)" }}>
                  <input type="checkbox" name="frameworks" value={f} className="accent-green-600" />
                  <span style={{ color: "var(--text)" }}>{f}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Current process */}
          <section>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Current workflow</h2>
            <div className="space-y-4">
              <div>
                <label className="label">What tools or process do you use today?</label>
                <textarea
                  name="current_tools"
                  rows={3}
                  className="input w-full resize-none"
                  placeholder="Spreadsheets, custom templates, another software platform…"
                />
              </div>
              <div>
                <label className="label">What's your biggest pain point right now?</label>
                <textarea
                  name="pain_point"
                  rows={3}
                  className="input w-full resize-none"
                  placeholder="Data collection takes forever, clients don't know what to send us, reporting is inconsistent across clients…"
                />
              </div>
            </div>
          </section>

          {/* Timeline + source */}
          <section>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>A few more things</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">When are you looking to get started? *</label>
                <select name="timeline" required className="input w-full">
                  <option value="">Select…</option>
                  <option value="ASAP">ASAP</option>
                  <option value="1–3 months">1–3 months</option>
                  <option value="3–6 months">3–6 months</option>
                  <option value="Just exploring">Just exploring for now</option>
                </select>
              </div>
              <div>
                <label className="label">How did you hear about Sendrow?</label>
                <input name="source" type="text" className="input w-full" placeholder="LinkedIn, referral, Google…" />
              </div>
            </div>
          </section>

          <div className="pt-2">
            <button type="submit" className="btn btn-primary w-full py-3 text-base">
              Submit — we'll be in touch within one business day
            </button>
            <p className="mt-3 text-center text-xs" style={{ color: "var(--text-muted)" }}>
              No spam. No sales pressure. Just a real conversation about whether this is the right fit.
            </p>
          </div>
        </form>
      </main>
    </>
  );
}
