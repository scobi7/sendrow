import { currentUser } from "@/lib/auth";
import { ensureDB, getCompany } from "@/lib/store";
import { gapAnalysis } from "@/lib/progress";
import { saveActionPlan } from "@/lib/actions";
import { PageHeader } from "@/components/ui";

export default async function Gaps() {
  await ensureDB();
  const user = currentUser()!;
  const company = getCompany(user.companyId);
  const gaps = gapAnalysis(company);
  const saved = company.actionPlan;

  const diffColor: Record<string, string> = {
    Easy: "bg-brand-50 text-brand-700",
    Medium: "bg-amber-50 text-amber-700",
    Hard: "bg-red-50 text-red-600",
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="How to Improve Your Score Next Year"
        subtitle="What's missing, why it matters, and how hard it is to fix. Completing these moves you up EcoVadis medal tiers and CDP score levels." />

      {gaps.length === 0 ? (
        <div className="card text-center text-slate-600">
          🎉 No gaps detected — your report covers everything we check for. See you next reporting cycle.
        </div>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-4">What&rsquo;s missing</th>
                  <th className="pb-2 pr-4">Why it matters</th>
                  <th className="pb-2">Difficulty</th>
                </tr>
              </thead>
              <tbody>
                {gaps.map((g, i) => (
                  <tr key={i} className="border-b border-slate-100 align-top">
                    <td className="py-3 pr-4 font-medium text-navy-900">{g.missing}</td>
                    <td className="py-3 pr-4 text-slate-500">{g.why}</td>
                    <td className="py-3">
                      <span className={`rounded px-2 py-0.5 text-xs font-semibold ${diffColor[g.difficulty]}`}>{g.difficulty}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card mt-6">
            <h2 className="font-semibold text-navy-900">What a more complete report unlocks</h2>
            <p className="mt-2 text-sm text-slate-500">
              Closing the <strong>Easy</strong> items typically moves an EcoVadis score from no-medal territory toward
              Bronze/Silver. Closing Scope 3 estimate gaps is the main lever for a CDP score above C. (Indicators are
              approximations based on published scoring criteria.)
            </p>
          </div>

          <form action={saveActionPlan.bind(null, gaps.map((g) => g.missing))} className="mt-6 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {saved
                ? `✓ Action plan saved (${saved.length} items) — it will resurface on your dashboard at the start of next reporting cycle.`
                : "Save these as your to-do list for next year."}
            </p>
            {!saved && <button className="btn-primary">Save as my action plan</button>}
          </form>
        </>
      )}
    </div>
  );
}
