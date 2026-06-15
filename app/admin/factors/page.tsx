export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { emissionFactors as factorsTable, userCompanies } from "@/lib/db/schema";
import { SEED_FACTORS } from "@/lib/factors";
import { EmissionFactor } from "@/lib/types";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "malachinguyenn@gmail.com";

const MIGRATION_SQL = `CREATE TABLE IF NOT EXISTS gt_emission_factors (
  factor_id text PRIMARY KEY,
  factor_name text NOT NULL,
  category text NOT NULL,
  value numeric(16,8) NOT NULL,
  unit text NOT NULL,
  source text NOT NULL DEFAULT '',
  source_url text NOT NULL DEFAULT '',
  year_effective integer NOT NULL,
  year_retired integer,
  updated_at text NOT NULL
);`;

const CATEGORY_LABELS: Record<string, string> = {
  mobile_combustion: "Mobile Combustion (Fleet)",
  stationary_combustion: "Stationary Combustion",
  electricity_location: "Electricity — Location-based",
  electricity_market: "Electricity — Market-based",
  refrigerant_gwp: "Refrigerants (GWP-100)",
  spend_based: "Spend-based Scope 3 (USEEIO)",
  commute: "Employee Commuting",
  waste: "Waste",
};

export default async function AdminFactorsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const userRow = await db.query.userCompanies.findFirst({
    where: eq(userCompanies.clerkId, userId),
  });
  if (!userRow || userRow.email !== ADMIN_EMAIL) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="font-semibold text-red-700">Access denied</p>
        <p className="mt-1 text-sm text-red-500">This page is restricted to the platform administrator.</p>
      </div>
    );
  }

  // Try to load DB overrides; if table doesn't exist, show migration banner
  let dbOverrides: EmissionFactor[] = [];
  let tableReady = true;

  try {
    const rows = await db.select().from(factorsTable);
    dbOverrides = rows.map((r) => ({
      factor_id: r.factorId,
      factor_name: r.factorName,
      category: r.category,
      value: Number(r.value),
      unit: r.unit,
      source: r.source,
      source_url: r.sourceUrl,
      year_effective: r.yearEffective,
      year_retired: r.yearRetired ?? null,
    }));
  } catch {
    tableReady = false;
  }

  async function saveOverride(formData: FormData) {
    "use server";
    const factorId = String(formData.get("factor_id"));
    const rawValue = formData.get("value");
    if (!factorId || rawValue === null || rawValue === "") return;
    const value = Number(rawValue);
    if (isNaN(value)) return;

    const seed = SEED_FACTORS.find((f) => f.factor_id === factorId);
    if (!seed) return;

    await db
      .insert(factorsTable)
      .values({
        factorId: seed.factor_id,
        factorName: seed.factor_name,
        category: seed.category,
        value: String(value),
        unit: seed.unit,
        source: seed.source,
        sourceUrl: seed.source_url,
        yearEffective: seed.year_effective,
        yearRetired: seed.year_retired ?? null,
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: factorsTable.factorId,
        set: { value: String(value), updatedAt: new Date().toISOString() },
      });

    revalidatePath("/admin/factors");
  }

  async function resetOverride(formData: FormData) {
    "use server";
    const factorId = String(formData.get("factor_id"));
    if (!factorId) return;
    await db.delete(factorsTable).where(eq(factorsTable.factorId, factorId));
    revalidatePath("/admin/factors");
  }

  // Group SEED_FACTORS by category
  const grouped = SEED_FACTORS.reduce<Record<string, typeof SEED_FACTORS>>((acc, f) => {
    (acc[f.category] ??= []).push(f);
    return acc;
  }, {});

  const overrideMap = new Map(dbOverrides.map((f) => [f.factor_id, f]));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Emission Factors</h1>
        <p className="mt-1 text-sm text-slate-500">
          Override the default hardcoded factor values. Changes take effect on the next calculation run.
          {dbOverrides.length > 0 && (
            <span className="ml-2 font-medium text-brand-700">{dbOverrides.length} active override{dbOverrides.length !== 1 ? "s" : ""}</span>
          )}
        </p>
      </div>

      {!tableReady && (
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-6">
          <p className="font-semibold text-amber-800">Database table required</p>
          <p className="mt-1 text-sm text-amber-700">
            Run this SQL in the Neon console to enable factor overrides:
          </p>
          <pre className="mt-3 rounded-lg bg-amber-900 p-4 text-xs text-amber-100 overflow-x-auto whitespace-pre-wrap">
            {MIGRATION_SQL}
          </pre>
        </div>
      )}

      <div className="space-y-10">
        {Object.entries(grouped).map(([category, factors]) => (
          <div key={category}>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
              {CATEGORY_LABELS[category] ?? category}
            </h2>
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3 text-left font-semibold">Factor</th>
                    <th className="px-4 py-3 text-left font-semibold">Default value</th>
                    <th className="px-4 py-3 text-left font-semibold">Unit</th>
                    <th className="px-4 py-3 text-left font-semibold">Source</th>
                    <th className="px-4 py-3 text-left font-semibold w-56">Override</th>
                    <th className="px-4 py-3 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {factors.map((factor) => {
                    const override = overrideMap.get(factor.factor_id);
                    return (
                      <tr key={factor.factor_id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{factor.factor_name}</p>
                          <p className="text-xs text-slate-400">{factor.factor_id}</p>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-700">{factor.value}</td>
                        <td className="px-4 py-3 text-slate-500">{factor.unit}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{factor.source} ({factor.year_effective})</td>
                        <td className="px-4 py-3">
                          {tableReady && (
                            <form action={saveOverride} className="flex gap-2 items-center">
                              <input type="hidden" name="factor_id" value={factor.factor_id} />
                              <input
                                type="number"
                                name="value"
                                step="any"
                                defaultValue={override?.value ?? factor.value}
                                className="w-32 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-mono focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                              />
                              <button
                                type="submit"
                                className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition-colors"
                              >
                                Save
                              </button>
                            </form>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {tableReady && override && (
                            <div className="flex flex-col gap-1.5">
                              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                Overridden
                              </span>
                              <form action={resetOverride}>
                                <input type="hidden" name="factor_id" value={factor.factor_id} />
                                <button type="submit" className="text-xs text-slate-400 hover:text-red-600 transition-colors">
                                  Reset
                                </button>
                              </form>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-sm font-semibold text-slate-700">SQL migration</p>
        <p className="mt-1 text-xs text-slate-500">If this is a new environment, run this in the Neon SQL editor:</p>
        <pre className="mt-3 rounded-lg bg-slate-800 p-4 text-xs text-slate-200 overflow-x-auto whitespace-pre-wrap">
          {MIGRATION_SQL}
        </pre>
      </div>
    </div>
  );
}
