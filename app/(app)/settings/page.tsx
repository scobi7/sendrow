import { currentUser } from "@/lib/auth";
import { getCompany } from "@/lib/store";
import { updateProfile, deleteAccount } from "@/lib/actions";
import { PageHeader } from "@/components/ui";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function Settings({ searchParams }: { searchParams: { saved?: string } }) {
  const user = currentUser()!;
  const company = getCompany(user.companyId);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your company profile, account, and data." />

      {searchParams.saved && (
        <p className="mb-4 rounded-lg bg-brand-50 px-4 py-2 text-sm text-brand-800">✓ Changes saved.</p>
      )}

      <form action={updateProfile} className="card mb-6">
        <h2 className="font-semibold text-navy-900">Company Profile</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Company name</label>
            <input name="company_name" className="input" defaultValue={company.name} />
          </div>
          <div>
            <label className="label">Industry</label>
            <input className="input bg-slate-50" disabled value={company.industry ?? ""} />
          </div>
          <div>
            <label className="label">Fiscal year end</label>
            <select name="fiscal_year_end" className="input" defaultValue={company.fiscalYearEndMonth ?? 12}>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-3 text-xs text-amber-600">
          ⚠ Changing fiscal year end re-scopes all calculations — resync connections afterwards.
        </p>
        <div className="mt-4 flex justify-end">
          <button className="btn-primary">Save profile</button>
        </div>
      </form>

      <div className="card mb-6">
        <h2 className="font-semibold text-navy-900">User Account</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Name</dt>
            <dd className="font-medium">{user.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-slate-400">
          Password change and billing are available in the production build with Stripe.
        </p>
      </div>

      <div className="card mb-6">
        <h2 className="font-semibold text-navy-900">Data Export</h2>
        <p className="mt-2 text-sm text-slate-500">
          Your data is yours. Export everything at any time — there is no lock-in.
        </p>
        <div className="mt-4 flex gap-3">
          <a href="/api/export/zip" className="btn-primary text-sm">
            Export all data (ZIP)
          </a>
          <a href="/api/export" className="btn-secondary text-sm">
            Export as JSON
          </a>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          ZIP contains separate CSV files for emissions, transactions, utility data, and audit log.
        </p>
      </div>

      <div className="card border-red-100">
        <h2 className="font-semibold text-red-700">Danger Zone</h2>
        <p className="mt-2 text-sm text-slate-500">
          Deleting your account removes your login access. Your company data is retained for 30 days.
        </p>
        <form action={deleteAccount} className="mt-4">
          <button
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
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
