import { currentUser } from "@/lib/auth";
import { getCompany } from "@/lib/store";
import { updateProfile, changePassword } from "@/lib/actions";
import { PageHeader } from "@/components/ui";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default async function Settings({ searchParams }: { searchParams: { saved?: string; pw_error?: string } }) {
  const user = (await currentUser())!;
  const company = await getCompany(user.companyId);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your company profile, account, and data." />

      {searchParams.saved && (
        <p className="mb-4 rounded-lg bg-brand-50 px-4 py-2 text-sm text-brand-800">✓ Changes saved.</p>
      )}

      {/* Company profile */}
      <form action={updateProfile} className="card mb-5">
        <h2 className="font-semibold text-navy-900">Company Profile</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Company name</label>
            <input name="company_name" className="input" defaultValue={company.name} />
          </div>
          <div>
            <label className="label">Industry</label>
            <input className="input bg-zinc-50" disabled value={company.industry ?? ""} />
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

      {/* User account */}
      <div className="card mb-5">
        <h2 className="font-semibold text-navy-900">User Account</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-zinc-500">Name</dt><dd className="font-medium">{user.name}</dd></div>
          <div className="flex justify-between"><dt className="text-zinc-500">Email</dt><dd className="font-medium">{user.email}</dd></div>
        </dl>
      </div>

      {/* Password change */}
      <form action={changePassword} className="card mb-5">
        <h2 className="font-semibold text-navy-900">Change Password</h2>
        {searchParams.pw_error === "wrong" && (
          <p className="mt-2 rounded bg-red-50 px-3 py-1.5 text-sm text-red-700">Current password is incorrect.</p>
        )}
        {searchParams.pw_error === "short" && (
          <p className="mt-2 rounded bg-red-50 px-3 py-1.5 text-sm text-red-700">New password must be 8+ characters.</p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="label">Current password</label>
            <input name="current_password" type="password" required className="input" autoComplete="current-password" />
          </div>
          <div>
            <label className="label">New password (8+ chars)</label>
            <input name="new_password" type="password" minLength={8} required className="input" autoComplete="new-password" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button className="btn-primary">Update password</button>
        </div>
      </form>

      {/* Data management */}
      <div className="card">
        <h2 className="font-semibold text-navy-900">Data Management</h2>
        <p className="mt-2 text-sm text-zinc-500">Your data is yours. Export everything at any time — there is no lock-in.</p>
        <div className="mt-4 flex gap-3">
          <a href="/api/export" className="btn-secondary text-sm">Export all data (JSON)</a>
          <span className="btn-secondary cursor-not-allowed text-sm opacity-40" title="Soft-delete with 30-day retention coming soon">Delete account</span>
        </div>
      </div>
    </div>
  );
}
