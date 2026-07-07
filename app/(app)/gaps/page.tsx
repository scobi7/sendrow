import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { loadCompany } from "@/lib/store";
import { gapAnalysis } from "@/lib/progress";
import { saveActionPlan } from "@/lib/actions";
import { PageHeader } from "@/components/ui";

const DIFF_STYLE: Record<string, { background: string; color: string }> = {
  Easy:   { background: "var(--primary-tint)", color: "var(--primary)" },
  Medium: { background: "var(--warning-tint)", color: "var(--warning)" },
  Hard:   { background: "var(--danger-tint)",  color: "var(--danger)"  },
};

export default async function Gaps() {
  const user = await currentUser();
  if (!user?.companyId) redirect("/onboarding");
  const company = await loadCompany(user.companyId);
  const gaps = gapAnalysis(company);
  const saved = company.actionPlan;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="How to Improve Your Score Next Year"
        subtitle="What's missing, why it matters, and how hard it is to fix. Completing these moves you up EcoVadis medal tiers and CDP score levels."
      />

      {gaps.length === 0 ? (
        <div className="card text-center" style={{ color: "var(--text-muted)" }}>
          No gaps detected — your report covers everything we check for. See you next reporting cycle.
        </div>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-left text-xs uppercase tracking-wide"
                  style={{ borderBottom: "1px solid var(--divider)", color: "var(--text-muted)" }}
                >
                  <th className="pb-2 pr-4">What&rsquo;s missing</th>
                  <th className="pb-2 pr-4">Why it matters</th>
                  <th className="pb-2">Difficulty</th>
                </tr>
              </thead>
              <tbody>
                {gaps.map((g, i) => (
                  <tr key={i} className="align-top" style={{ borderBottom: "1px solid var(--divider)" }}>
                    <td className="py-3 pr-4 font-medium" style={{ color: "var(--text)" }}>{g.missing}</td>
                    <td className="py-3 pr-4" style={{ color: "var(--text-muted)" }}>{g.why}</td>
                    <td className="py-3">
                      <span
                        className="rounded px-2 py-0.5 text-xs font-semibold"
                        style={DIFF_STYLE[g.difficulty]}
                      >
                        {g.difficulty}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card mt-6">
            <h2 className="font-semibold font-display" style={{ color: "var(--text)" }}>What a more complete report unlocks</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Closing the <strong style={{ color: "var(--text)" }}>Easy</strong> items typically moves an EcoVadis score from no-medal
              territory toward Bronze/Silver. Closing Scope 3 estimate gaps is the main lever for a CDP score above C.
              (Indicators are approximations based on published scoring criteria.)
            </p>
          </div>

          <form action={saveActionPlan.bind(null, gaps.map((g) => g.missing))} className="mt-6 flex items-center justify-between">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {saved
                ? `✓ Action plan saved (${saved.length} items) — it will resurface on your dashboard at the start of next reporting cycle.`
                : "Save these as your to-do list for next year."}
            </p>
            {!saved && <button className="btn btn-primary">Save as my action plan</button>}
          </form>
        </>
      )}
    </div>
  );
}
