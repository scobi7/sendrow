import { currentUser } from "@/lib/auth";
import { getCompany } from "@/lib/store";
import { updateProfile } from "@/lib/actions";
import { PageHeader } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default async function Settings({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const user = (await currentUser())!;
  const company = await getCompany(user.companyId);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your company, display, and account preferences." />

      {saved && (
        <p className="mb-4 rounded-lg px-4 py-2 text-sm" style={{ background: "var(--brand-light)", color: "var(--brand-text)" }}>
          ✓ Changes saved.
        </p>
      )}

      {/* Company Profile */}
      <form action={updateProfile} className="card mb-5">
        <h2 className="font-semibold" style={{ color: "var(--text-1)" }}>Company Profile</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Company name</label>
            <input name="company_name" className="input" defaultValue={company.name} />
          </div>
          <div>
            <label className="label">Industry</label>
            <input className="input opacity-60 cursor-not-allowed" disabled value={company.industry ?? ""} />
          </div>
          <div>
            <label className="label">Fiscal year end</label>
            <select name="fiscal_year_end" className="input" defaultValue={company.fiscalYearEndMonth ?? 12}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
        </div>
        <p className="mt-3 text-xs text-amber-600">⚠ Changing fiscal year end re-scopes all calculations — resync connections afterwards.</p>
        <div className="mt-4 flex justify-end"><button className="btn-primary">Save profile</button></div>
      </form>

      {/* Contact */}
      <div className="card mb-5">
        <h2 className="font-semibold" style={{ color: "var(--text-1)" }}>Contact</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>Your identity is managed by Clerk. Click below to update your name, email, or password.</p>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt style={{ color: "var(--text-2)" }}>Name</dt>
            <dd className="font-medium" style={{ color: "var(--text-1)" }}>{user.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt style={{ color: "var(--text-2)" }}>Email</dt>
            <dd className="font-medium" style={{ color: "var(--text-1)" }}>{user.email}</dd>
          </div>
        </dl>
        <div className="mt-4 flex gap-3 text-sm" style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
          <span style={{ color: "var(--text-3)" }}>Need help?</span>
          <a href="mailto:support@greentrack.app" className="font-medium hover:underline" style={{ color: "var(--brand)" }}>
            support@greentrack.app
          </a>
        </div>
      </div>

      {/* Display */}
      <div className="card mb-5">
        <h2 className="font-semibold" style={{ color: "var(--text-1)" }}>Display</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>Choose how GreenTrack looks. System follows your OS preference.</p>
        <div className="mt-4">
          <ThemeToggle />
        </div>
      </div>

      {/* Data */}
      <div className="card">
        <h2 className="font-semibold" style={{ color: "var(--text-1)" }}>Data Management</h2>
        <p className="mt-2 text-sm" style={{ color: "var(--text-2)" }}>Your data is yours. Export everything at any time.</p>
        <div className="mt-4 flex gap-3">
          <a href="/api/export" className="btn-secondary text-sm">Export all data (JSON)</a>
          <span className="btn-secondary cursor-not-allowed text-sm opacity-40">Delete account</span>
        </div>
      </div>
    </div>
  );
}
