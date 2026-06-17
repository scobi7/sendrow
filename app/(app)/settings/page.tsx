import { currentUser } from "@/lib/auth";
import { loadCompany } from "@/lib/store";
import { updateProfile, deleteAccount } from "@/lib/actions";
import { PageHeader } from "@/components/ui";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function Settings({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [{ saved }, user] = await Promise.all([searchParams, currentUser()]);
  const company = await loadCompany(user!.companyId);
  const u = user!;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your company profile, account, and data." />

      {saved && (
        <p
          className="mb-4 rounded-lg px-4 py-2 text-sm"
          style={{ background: "var(--primary-tint)", color: "var(--primary)" }}
        >
          ✓ Changes saved.
        </p>
      )}

      <form action={updateProfile} className="card mb-6">
        <h2 className="font-semibold font-display" style={{ color: "var(--text)" }}>Company Profile</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Company name</label>
            <input name="company_name" className="input" defaultValue={company.name} />
          </div>
          <div>
            <label className="label">Industry</label>
            <input
              className="input"
              disabled
              value={company.industry ?? ""}
              style={{ background: "var(--bg)" }}
            />
          </div>
          <div>
            <label className="label">Fiscal year end</label>
            <select name="fiscal_year_end" className="input" defaultValue={company.fiscalYearEndMonth ?? 12}>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-3 text-xs" style={{ color: "var(--warning)" }}>
          ⚠ Changing fiscal year end re-scopes all calculations — resync connections afterwards.
        </p>
        <div className="mt-4 flex justify-end">
          <button className="btn btn-primary">Save profile</button>
        </div>
      </form>

      <div className="card mb-6">
        <h2 className="font-semibold font-display" style={{ color: "var(--text)" }}>User Account</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt style={{ color: "var(--text-muted)" }}>Name</dt>
            <dd className="font-medium" style={{ color: "var(--text)" }}>{u.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt style={{ color: "var(--text-muted)" }}>Email</dt>
            <dd className="font-medium" style={{ color: "var(--text)" }}>{u.email}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
          Password change and billing are available in the production build with Stripe.
        </p>
      </div>

      <div className="card mb-6">
        <h2 className="font-semibold font-display" style={{ color: "var(--text)" }}>Data Export</h2>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          Your data is yours. Export everything at any time — there is no lock-in.
        </p>
        <div className="mt-4 flex gap-3">
          <a href="/api/export/zip" className="btn btn-primary text-sm">Export all data (ZIP)</a>
          <a href="/api/export" className="btn btn-secondary text-sm">Export as JSON</a>
        </div>
        <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
          ZIP contains separate CSV files for emissions, transactions, utility data, and audit log.
        </p>
      </div>

      <div className="card" style={{ borderColor: "var(--danger-tint)" }}>
        <h2 className="font-semibold font-display" style={{ color: "var(--danger)" }}>Danger Zone</h2>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          Deleting your account removes your login access. Your company data is retained for 30 days.
        </p>
        <form action={deleteAccount} className="mt-4">
          <button
            className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
            style={{
              borderColor: "var(--danger-tint)",
              color: "var(--danger)",
            }}
            onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--danger-tint)")}
            onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = "")}
            onClick={(e) => {
              if (!confirm("Are you sure? This will delete your account.")) e.preventDefault();
            }}
          >
            Delete my account
          </button>
        </form>
      </div>
    </div>
  );
}
