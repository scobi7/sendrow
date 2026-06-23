import { notFound, redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { consultantClients } from "@/lib/db/schema";
import { loadCompany } from "@/lib/store";
import { PageHeader } from "@/components/ui";
import { consultantSaveFields, consultantSaveLeadership, consultantSavePolicy } from "@/lib/consultant-actions";

const POLICIES = [
  "Code of conduct",
  "Whistleblower policy",
  "Anti-bribery policy",
  "Data privacy policy",
  "Environmental policy",
  "Equal opportunity policy",
];
const LEVELS = ["C-Suite", "VP/Director", "Manager", "Individual Contributor"];

export default async function ManageGovernance({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user || user.role !== "consultant") redirect("/login");

  const link = await db.query.consultantClients.findFirst({
    where: and(eq(consultantClients.consultantId, user.id), eq(consultantClients.companyId, id), isNull(consultantClients.archivedAt)),
  });
  if (!link) notFound();

  const company = await loadCompany(id);
  const inp = company.inputs;
  const base = `/consultant/clients/${id}/manage`;
  const policies = inp.gov_policies ?? {};
  const leadership = inp.gov_leadership ?? {};
  const smallCompany = company.headcountRange === "under_50";

  const boundSave = consultantSaveFields.bind(null, id);
  const boundSaveLeadership = consultantSaveLeadership.bind(null, id);

  return (
    <div>
      <PageHeader
        title="Governance — Leadership and Policies"
        subtitle={`Managing on behalf of ${company.name}.`}
      />

      {!smallCompany && (
        <form action={boundSaveLeadership} className="card mb-5">
          <h2 className="font-semibold font-display" style={{ color: "var(--text)" }}>Leadership Diversity</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Approximate percentages are fine.</p>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide" style={{ borderBottom: "1px solid var(--divider)", color: "var(--text-muted)" }}>
                <th className="pb-2">Role level</th>
                <th className="pb-2">% women</th>
                <th className="pb-2">% underrepresented groups</th>
              </tr>
            </thead>
            <tbody>
              {LEVELS.map((lvl) => (
                <tr key={lvl} style={{ borderBottom: "1px solid var(--divider)" }}>
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
            <button className="btn btn-secondary px-3 py-1.5 text-xs">Save leadership table</button>
          </div>
        </form>
      )}

      <div className="card mb-5">
        <h2 className="font-semibold font-display" style={{ color: "var(--text)" }}>Policies</h2>
        <div className="mt-4 space-y-2">
          {POLICIES.map((p) => {
            const v = policies[p];
            return (
              <div key={p} className="flex items-center justify-between rounded-lg px-4 py-2.5 text-sm" style={{ border: "1px solid var(--divider)" }}>
                <span className="font-medium" style={{ color: "var(--text)" }}>{p}</span>
                <span className="flex items-center gap-2">
                  {v === true && <span className="text-xs font-semibold" style={{ color: "var(--status-green)" }}>✓ In place</span>}
                  {v === false && <span className="text-xs font-semibold" style={{ color: "var(--warning)" }}>Not yet</span>}
                  <form action={consultantSavePolicy.bind(null, id, p, true)}>
                    <button className="btn btn-secondary px-2.5 py-1 text-xs" style={v === true ? { borderColor: "var(--primary)", color: "var(--primary)" } : {}}>Yes</button>
                  </form>
                  <form action={consultantSavePolicy.bind(null, id, p, false)}>
                    <button className="btn btn-secondary px-2.5 py-1 text-xs" style={v === false ? { borderColor: "var(--warning)", color: "var(--warning)" } : {}}>No</button>
                  </form>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <form action={boundSave} className="card">
        <input type="hidden" name="redirect_to" value={`${base}/governance`} />
        <h2 className="font-semibold font-display" style={{ color: "var(--text)" }}>Data Privacy</h2>
        <div className="mt-4 space-y-3 text-sm">
          {[
            ["gov_ccpa_compliant", "Is the company CCPA compliant?", inp.gov_ccpa_compliant],
            ["gov_public_privacy_policy", "Is there a public privacy policy?", inp.gov_public_privacy_policy],
            ["gov_data_breaches", "Any data breaches in the past year?", inp.gov_data_breaches],
          ].map(([name, q, v]) => (
            <div key={name as string} className="flex items-center justify-between">
              <span style={{ color: "var(--text)" }}>{q as string}</span>
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
          <button className="btn btn-primary">Save Governance</button>
        </div>
      </form>
    </div>
  );
}
