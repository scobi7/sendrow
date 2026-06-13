import { currentUser } from "@/lib/auth";
import { getCompany } from "@/lib/store";
import { updateProfile } from "@/lib/actions";
import { PageHeader } from "@/components/ui";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

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
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
        </div>
        <p className="mt-3 text-xs text-amber-600">
          ⚠ Changing fiscal year end re-scopes all calculations to a different 12-month window — resync connections afterwards.
        </p>
        <div className="mt-4 flex justify-end">
          <button className="btn-primary">Save profile</button>
        </div>
      </form>

      <div className="card mb-6">
        <h2 className="font-semibold text-navy-900">User Account</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-slate-500">Name</dt><dd className="font-medium">{user.name}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd className="font-medium">{user.email}</dd></div>
        </dl>
        <p className="mt-3 text-xs text-slate-400">Password change, billing, and invoices are wired to Stripe in the production build.</p>
      </div>

      <div className="card">
        <h2 className="font-semibold text-navy-900">Data Management</h2>
        <p className="mt-2 text-sm text-slate-500">
          Your data is yours. Export everything at any time — there is no lock-in.
        </p>
        <div className="mt-4 flex gap-3">
          <a href="/api/export" className="btn-secondary text-sm">Export all data (JSON)</a>
          <span className="btn-secondary cursor-not-allowed text-sm opacity-50" title="Production build: soft-delete with 30-day retention">Delete account</span>
        </div>
      </div>
    </div>
  );
}
