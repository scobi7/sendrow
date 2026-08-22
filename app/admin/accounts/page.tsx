export const dynamic = "force-dynamic";

import { desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { userCompanies } from "@/lib/db/schema";
import { PageHeader } from "@/components/ui";

type PlanStatus = "active" | "inactive" | "none";

async function isAdmin() {
  const { userId } = await auth();
  return !!userId && userId === process.env.ADMIN_CLERK_ID;
}

async function grantFreeAccess(clerkId: string, formData: FormData) {
  "use server";
  void formData;
  if (!(await isAdmin())) return;
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(clerkId);
  const plan = (user.publicMetadata as { plan?: string })?.plan ?? "consultant";
  await clerk.users.updateUserMetadata(clerkId, {
    publicMetadata: { plan, planStatus: "active", comped: true },
  });
  revalidatePath("/admin/accounts");
}

async function revokeAccess(clerkId: string, formData: FormData) {
  "use server";
  void formData;
  if (!(await isAdmin())) return;
  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(clerkId, {
    publicMetadata: { planStatus: "inactive", comped: false },
  });
  revalidatePath("/admin/accounts");
}

const STATUS_STYLE: Record<PlanStatus, { background: string; color: string; label: string }> = {
  active: { background: "var(--primary-tint)", color: "var(--primary)", label: "Active" },
  inactive: { background: "var(--divider)", color: "var(--text-muted)", label: "Inactive" },
  none: { background: "var(--warning-tint)", color: "var(--warning-strong)", label: "Never paid" },
};

/** Admin: grant/revoke free access (Plan MO follow-up) — lets Malachi comp a
 *  consultant's account (e.g. a demo prospect) the same way the Stripe webhook
 *  would after a real payment, without them going through /checkout. */
export default async function AdminAccountsPage() {
  const accounts = await db.query.userCompanies.findMany({
    orderBy: desc(userCompanies.createdAt),
  });

  const clerk = await clerkClient();
  const rows = await Promise.all(
    accounts.map(async (account) => {
      try {
        const user = await clerk.users.getUser(account.clerkId);
        const meta = user.publicMetadata as { planStatus?: string; comped?: boolean };
        return {
          ...account,
          planStatus: (meta.planStatus as PlanStatus) ?? "none",
          comped: !!meta.comped,
          clerkFound: true,
        };
      } catch {
        return { ...account, planStatus: "none" as PlanStatus, comped: false, clerkFound: false };
      }
    })
  );

  const compedCount = rows.filter((r) => r.comped).length;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Accounts"
        subtitle={`${rows.length} account${rows.length !== 1 ? "s" : ""} · ${compedCount} comped free · billing gate is currently disabled site-wide, so this only matters once it's re-enabled`}
      />

      {rows.length === 0 ? (
        <div className="card py-12 text-center" style={{ color: "var(--text-muted)" }}>
          No accounts yet — they appear after someone signs up and completes onboarding.
        </div>
      ) : (
        <div className="glass-panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left text-xs font-semibold uppercase tracking-wide"
                style={{ borderBottom: "1px solid var(--divider)", color: "var(--text-muted)" }}
              >
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Billing status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((account) => (
                <tr key={account.clerkId} style={{ borderBottom: "1px solid var(--divider)" }}>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--text)" }}>{account.name}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{account.email}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{account.role}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                    {new Date(account.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={STATUS_STYLE[account.planStatus]}
                      >
                        {STATUS_STYLE[account.planStatus].label}
                      </span>
                      {account.comped && (
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                          style={{ background: "var(--primary)", color: "#fff" }}
                        >
                          Comped
                        </span>
                      )}
                      {!account.clerkFound && (
                        <span className="text-xs" style={{ color: "var(--danger)" }}>
                          No Clerk record
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {account.clerkFound && (
                      account.planStatus === "active" ? (
                        <form action={revokeAccess.bind(null, account.clerkId)}>
                          <button className="text-xs font-medium underline" style={{ color: "var(--danger)" }}>
                            Revoke
                          </button>
                        </form>
                      ) : (
                        <form action={grantFreeAccess.bind(null, account.clerkId)}>
                          <button className="btn btn-primary px-3 py-1.5 text-xs">Grant free access</button>
                        </form>
                      )
                    )}
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
