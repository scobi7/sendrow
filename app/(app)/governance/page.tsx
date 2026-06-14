import { currentUser } from "@/lib/auth";
import { loadCompany } from "@/lib/store";
import { saveFields, saveLeadership, savePolicy } from "@/lib/actions";
import { PageHeader } from "@/components/ui";

const POLICIES = [
  "Code of conduct",
  "Whistleblower policy",
  "Anti-bribery policy",
  "Data privacy policy",
  "Environmental policy",
  "Equal opportunity policy",
];
const LEVELS = ["C-Suite", "VP/Director", "Manager", "Individual Contributor"];

export default async function Governance() {
  const user = (await currentUser())!;
  const company = await loadCompany(user.companyId);
  const inp = company.inputs;
  const policies = inp.gov_policies ?? {};
  const leadership = inp.gov_leadership ?? {};
  const smallCompany = company.headcountRange === "under_50";

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Governance — Your Leadership and Policies"
        subtitle="Mostly checkboxes. Missing policies lower your EcoVadis score — the quick wins are highlighted in your Gap Analysis." />

      {!smallCompany && (
        <form action={saveLeadership} className="card mb-5">
          <h2 className="font-semibold text-navy-900">Leadership Diversity</h2>
          <p className="mt-1 text-sm text-slate-500">Approximate percentages are fine.</p>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2">Role level</th>
                <th className="pb-2">% women</th>
                <th className="pb-2">% underrepresented groups</th>
              </tr>
            </thead>
            <tbody>
              {LEVELS.map((lvl) => (
                <tr key={lvl} className="border-b border-slate-100">
                  <td className="py-2 font-medium">{lvl}</td>
                  <td className="py-2 pr-4">
                    <input name={`${lvl}_women`} type="number" min={0} max={100} className="input w-24" defaultValue={leadership[lvl]?.womenPct ?? ""} />
                  </td>
                  <td className="py-2">
                    <input name={`${lvl}_minority`} type="number" min={0} max={100} className="input w-24" defaultValue={leadership[lvl]?.minorityPct ?? ""} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-end">
            <button className="btn-secondary px-3 py-1.5 text-xs">Save leadership table</button>
          </div>
        </form>
      )}

      <div className="card mb-5">
        <h2 className="font-semibold text-navy-900">Policies</h2>
        <p className="mt-1 text-sm text-slate-500">Document upload on each &ldquo;yes&rdquo; is wired to S3 in the production build.</p>
        <div className="mt-4 space-y-2">
          {POLICIES.map((p) => {
            const v = policies[p];
            return (
              <div key={p} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-2.5 text-sm">
                <span className="font-medium text-slate-700">{p}</span>
                <span className="flex items-center gap-2">
                  {v === true && <span className="text-xs font-semibold text-brand-700">✓ In place</span>}
                  {v === false && <span className="text-xs font-semibold text-amber-600">Not yet — see Gap Analysis</span>}
                  <form action={savePolicy.bind(null, p, true)}>
                    <button className={`btn-secondary px-2.5 py-1 text-xs ${v === true ? "border-brand-500 text-brand-700" : ""}`}>Yes</button>
                  </form>
                  <form action={savePolicy.bind(null, p, false)}>
                    <button className={`btn-secondary px-2.5 py-1 text-xs ${v === false ? "border-amber-500 text-amber-700" : ""}`}>No</button>
                  </form>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <form action={saveFields} className="card">
        <input type="hidden" name="redirect_to" value="/governance" />
        <h2 className="font-semibold text-navy-900">Data Privacy</h2>
        <div className="mt-4 space-y-3 text-sm">
          {[
            ["gov_ccpa_compliant", "Is your company CCPA compliant?", inp.gov_ccpa_compliant],
            ["gov_public_privacy_policy", "Do you have a public privacy policy?", inp.gov_public_privacy_policy],
            ["gov_data_breaches", "Any data breaches in the past year?", inp.gov_data_breaches],
          ].map(([name, q, v]) => (
            <div key={name as string} className="flex items-center justify-between">
              <span className="text-slate-700">{q as string}</span>
              <span className="flex gap-4">
                <label className="flex items-center gap-1.5">
                  <input type="radio" name={name as string} value="yes" defaultChecked={v === true} /> Yes
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="radio" name={name as string} value="no" defaultChecked={v === false} /> No
                </label>
              </span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <button className="btn-primary">Save Governance</button>
        </div>
      </form>
    </div>
  );
}
