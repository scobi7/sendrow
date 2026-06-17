import { currentUser } from "@/lib/auth";
import { loadCompany } from "@/lib/store";
import { updateProfile, deleteAccount, addLocation, removeLocation } from "@/lib/actions";
import { PageHeader } from "@/components/ui";
import { DeleteAccountButton } from "./delete-button";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function Settings({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [{ saved, error }, user] = await Promise.all([searchParams, currentUser()]);
  const company = await loadCompany(user!.companyId);
  const u = user!;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your company profile, locations, and account." />

      {saved && (
        <p className="mb-4 rounded-lg px-4 py-2 text-sm" style={{ background: "var(--primary-tint)", color: "var(--primary)" }}>
          ✓ Changes saved.
        </p>
      )}
      {error === "location" && (
        <p className="mb-4 rounded-lg px-4 py-2 text-sm" style={{ background: "var(--warning-tint)", color: "var(--warning)" }}>
          City and state are required to add a location.
        </p>
      )}

      {/* Company Profile */}
      <form action={updateProfile} className="card mb-6">
        <h2 className="font-semibold font-display" style={{ color: "var(--text)" }}>Company Profile</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Company name</label>
            <input name="company_name" className="input" defaultValue={company.name} />
          </div>
          <div>
            <label className="label">Industry</label>
            <input className="input" disabled value={company.industry ?? ""} style={{ background: "var(--bg)" }} />
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
          Changing fiscal year end re-scopes all calculations — resync connections afterwards.
        </p>
        <div className="mt-4 flex justify-end">
          <button className="btn btn-primary">Save profile</button>
        </div>
      </form>

      {/* Locations */}
      <div className="card mb-6">
        <h2 className="font-semibold font-display" style={{ color: "var(--text)" }}>Locations</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Each location maps to a separate utility meter. Different grid regions have different emission factors.
        </p>

        {company.locations.length > 0 && (
          <div className="mt-4 space-y-2">
            {company.locations.map((loc) => (
              <div
                key={loc.id}
                className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: "var(--bg)", border: "1px solid var(--divider)" }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    {loc.address ? `${loc.address}, ` : ""}{loc.city}, {loc.state} {loc.zip}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    eGRID: {loc.egridSubregion}
                  </p>
                </div>
                <form action={removeLocation}>
                  <input type="hidden" name="loc_id" value={loc.id} />
                  <button
                    type="submit"
                    className="text-xs font-medium px-3 py-1.5 rounded-lg"
                    style={{ color: "var(--danger)", background: "var(--danger-tint)" }}
                  >
                    Remove
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

        <form action={addLocation} className="mt-4 rounded-xl p-4" style={{ border: "1px dashed var(--divider)" }}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Add a location
          </p>
          <div className="grid grid-cols-2 gap-3">
            <input name="address" className="input col-span-2" placeholder="Street address (optional)" />
            <input name="city" className="input" placeholder="City" required />
            <div className="flex gap-2">
              <input name="state" className="input w-16" placeholder="CA" maxLength={2} defaultValue="CA" />
              <input name="zip" className="input" placeholder="ZIP" />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button type="submit" className="btn btn-primary text-sm px-4 py-2">Add location</button>
          </div>
        </form>
      </div>

      {/* User Account */}
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

      {/* Data Export */}
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

      {/* Danger Zone */}
      <div className="card" style={{ borderColor: "var(--danger-tint)" }}>
        <h2 className="font-semibold font-display" style={{ color: "var(--danger)" }}>Danger Zone</h2>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          Deleting your account removes your login access. Your company data is retained for 30 days.
        </p>
        <div className="mt-4">
          <DeleteAccountButton action={deleteAccount} />
        </div>
      </div>
    </div>
  );
}
