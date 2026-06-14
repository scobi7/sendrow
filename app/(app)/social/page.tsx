import { currentUser } from "@/lib/auth";
import { ensureDB, getCompany } from "@/lib/store";
import { saveFields } from "@/lib/actions";
import { InfoTip, PageHeader } from "@/components/ui";

export default async function Social() {
  await ensureDB();
  const user = currentUser()!;
  const company = getCompany(user.companyId);
  const inp = company.inputs;
  const turnover =
    inp.social_departures != null && inp.social_total_employees
      ? Math.round((inp.social_departures / inp.social_total_employees) * 1000) / 10
      : null;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Social — Your Workforce Data"
        subtitle="Mostly numbers your operations manager knows without looking anything up. None of this affects your CO2e — it feeds the ESG report and questionnaire answers." />

      <form action={saveFields} className="space-y-5">
        <input type="hidden" name="redirect_to" value="/social" />

        <div className="card">
          <h2 className="font-semibold text-navy-900">
            Headcount &amp; Turnover <InfoTip text="Customers ask for turnover because high churn correlates with labor issues. A normal number here is a good answer." />
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
            <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">Turnover rate (auto-calculated): <strong>{turnover}%</strong></p>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-navy-900">
            Health &amp; Safety <InfoTip text="ESG frameworks treat worker safety as a core metric. These come straight from your OSHA 300 log." />
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
          <h2 className="font-semibold text-navy-900">
            Training Hours <InfoTip text="Total formal training hours across all staff this year. Industry average for mid-market companies is roughly 8–20 hours per employee." />
          </h2>
          <div className="mt-4">
            <label className="label">Total training hours this year</label>
            <input name="social_training_hours" type="number" min={0} className="input w-48" defaultValue={inp.social_training_hours ?? ""} />
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-navy-900">
            Workforce Demographics <InfoTip text="Used for EcoVadis Labor & Human Rights scoring. The Excel template keeps individual data out of the platform — only aggregates are stored." />
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Download the Excel template, fill in role level, gender, and ethnicity columns, and upload it back.
            (Template download/upload wired to S3 in the production build.)
          </p>
          <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" name="social_demographics_uploaded" value="true" defaultChecked={!!inp.social_demographics_uploaded} />
            Demographics template completed and uploaded
          </label>
        </div>

        <div className="flex justify-end">
          <button className="btn-primary">Save Social</button>
        </div>
      </form>
    </div>
  );
}
