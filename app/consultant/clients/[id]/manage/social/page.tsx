import { notFound, redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { consultantClients } from "@/lib/db/schema";
import { loadCompany } from "@/lib/store";
import { InfoTip, PageHeader } from "@/components/ui";
import { consultantSaveFields } from "@/lib/consultant-actions";

export default async function ManageSocial({ params }: { params: Promise<{ id: string }> }) {
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
  const turnover =
    inp.social_departures != null && inp.social_total_employees
      ? Math.round((inp.social_departures / inp.social_total_employees) * 1000) / 10
      : null;

  const boundSave = consultantSaveFields.bind(null, id);

  return (
    <div>
      <PageHeader
        title="Social — Workforce Data"
        subtitle={`Entering on behalf of ${company.name}. None of this affects CO2e — it feeds the ESG report.`}
      />

      <form action={boundSave} className="space-y-5">
        <input type="hidden" name="redirect_to" value={`${base}/social`} />

        <div className="card">
          <h2 className="font-semibold font-display" style={{ color: "var(--text)" }}>
            Headcount &amp; Turnover{" "}
            <InfoTip text="High churn correlates with labor issues in ESG frameworks. A normal number here is a good answer." />
          </h2>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div>
              <label className="label">Total employees</label>
              <input name="social_total_employees" type="number" min={0} className="input" defaultValue={inp.social_total_employees ?? ""} />
            </div>
            <div>
              <label className="label">New hires this year</label>
              <input name="social_new_hires" type="number" min={0} className="input" defaultValue={inp.social_new_hires ?? ""} />
            </div>
            <div>
              <label className="label">Departures this year</label>
              <input name="social_departures" type="number" min={0} className="input" defaultValue={inp.social_departures ?? ""} />
            </div>
          </div>
          {turnover !== null && (
            <p className="mt-3 rounded-lg px-3 py-2 text-sm" style={{ background: "var(--primary-tint)", color: "var(--primary)" }}>
              Turnover rate (auto-calculated): <strong>{turnover}%</strong>
            </p>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold font-display" style={{ color: "var(--text)" }}>
            Health &amp; Safety{" "}
            <InfoTip text="From the client's OSHA 300 log." />
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className="label">Lost time injuries</label>
              <input name="social_lost_time_injuries" type="number" min={0} className="input" defaultValue={inp.social_lost_time_injuries ?? ""} />
            </div>
            <div>
              <label className="label">OSHA recordables</label>
              <input name="social_osha_recordables" type="number" min={0} className="input" defaultValue={inp.social_osha_recordables ?? ""} />
            </div>
            <div>
              <label className="label">Near misses</label>
              <input name="social_near_misses" type="number" min={0} className="input" defaultValue={inp.social_near_misses ?? ""} />
            </div>
            <div>
              <label className="label">Days lost to injury</label>
              <input name="social_days_lost" type="number" min={0} className="input" defaultValue={inp.social_days_lost ?? ""} />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold font-display" style={{ color: "var(--text)" }}>
            Training Hours{" "}
            <InfoTip text="Total formal training hours across all staff this year. Industry average is roughly 8–20 hrs/employee." />
          </h2>
          <div className="mt-4">
            <label className="label">Total training hours this year</label>
            <input name="social_training_hours" type="number" min={0} className="input w-48" defaultValue={inp.social_training_hours ?? ""} />
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold font-display" style={{ color: "var(--text)" }}>Workforce Demographics</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            For EcoVadis Labor &amp; Human Rights scoring. Only aggregates are stored.
          </p>
          <label className="mt-3 flex items-center gap-2 text-sm" style={{ color: "var(--text)" }}>
            <input type="checkbox" name="social_demographics_uploaded" value="true" defaultChecked={!!inp.social_demographics_uploaded} />
            Demographics template completed and uploaded
          </label>
        </div>

        <div className="flex justify-end">
          <button className="btn btn-primary">Save Social</button>
        </div>
      </form>
    </div>
  );
}
