export const dynamic = "force-dynamic";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { referralLeads } from "@/lib/db/schema";
import { PageHeader } from "@/components/ui";

const STATUSES = ["new", "routed", "converted", "dead"] as const;

const STATUS_STYLE: Record<string, { background: string; color: string }> = {
  new: { background: "var(--warning-tint)", color: "var(--warning-strong)" },
  routed: { background: "var(--primary-tint)", color: "var(--primary)" },
  converted: { background: "var(--primary)", color: "#fff" },
  dead: { background: "var(--divider)", color: "var(--text-muted)" },
};

async function setLeadStatus(id: string, status: string, formData: FormData) {
  "use server";
  const { userId } = await auth();
  if (!userId || userId !== process.env.ADMIN_CLERK_ID) return;
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) return;
  void formData;
  await db.update(referralLeads).set({ status }).where(eq(referralLeads.id, id));
  revalidatePath("/admin/referrals");
}

/** Referral routing ops (Plan N7): every inbound company is a lead we place
 *  with a partner consultant - this board tracks placement and conversion. */
export default async function AdminReferralsPage() {
  const leads = await db.select().from(referralLeads).orderBy(desc(referralLeads.createdAt));
  const converted = leads.filter((l) => l.status === "converted").length;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Referral Leads"
        subtitle={`${leads.length} lead${leads.length !== 1 ? "s" : ""} · ${converted} converted`}
      />

      {leads.length === 0 ? (
        <div className="card py-12 text-center" style={{ color: "var(--text-muted)" }}>
          No leads yet - they arrive from /get-matched.
        </div>
      ) : (
        <div className="glass-panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left text-xs font-semibold uppercase tracking-wide"
                style={{ borderBottom: "1px solid var(--divider)", color: "var(--text-muted)" }}
              >
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Trigger</th>
                <th className="px-4 py-3">Received</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} style={{ borderBottom: "1px solid var(--divider)" }}>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--text)" }}>{lead.company}</td>
                  <td className="px-4 py-3">
                    <p style={{ color: "var(--text)" }}>{lead.name}</p>
                    <a href={`mailto:${lead.email}`} className="text-xs underline" style={{ color: "var(--primary)" }}>
                      {lead.email}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{lead.trigger ?? " - "}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1">
                      {STATUSES.map((s) => (
                        <form key={s} action={setLeadStatus.bind(null, lead.id, s)}>
                          <button
                            className="rounded-full px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-80"
                            style={
                              lead.status === s
                                ? STATUS_STYLE[s]
                                : { background: "transparent", color: "var(--text-muted)", border: "1px solid var(--divider)" }
                            }
                          >
                            {s}
                          </button>
                        </form>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
