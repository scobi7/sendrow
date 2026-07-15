import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, isNull } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { companies, consultantClients, evidence, shareLinks, snapshots, userCompanies } from "@/lib/db/schema";
import { shareSnapshot, revokeShareLink } from "@/lib/consultant-actions";
import { BackLink } from "@/components/workflow";
import { ShareLinkButton } from "../../share-link-button";
import type { SnapshotTotals } from "@/lib/snapshots";

/** Snapshot & Share (#8 #10 #9): after approving — freeze + send data out.
 *  The snapshot is immutable; corrections create a new one and this stays on
 *  record. */
export default async function SnapshotSharePage({
  params,
}: {
  params: Promise<{ id: string; snapshotId: string }>;
}) {
  const [{ id, snapshotId }, user] = await Promise.all([params, currentUser()]);

  const link = await db.query.consultantClients.findFirst({
    where: and(
      eq(consultantClients.consultantId, user!.id),
      eq(consultantClients.companyId, id),
      isNull(consultantClients.archivedAt)
    ),
  });
  if (!link) notFound();

  const [company, snap] = await Promise.all([
    db.query.companies.findFirst({ where: eq(companies.id, id) }),
    db.query.snapshots.findFirst({ where: eq(snapshots.id, snapshotId) }),
  ]);
  if (!company || !snap || snap.companyId !== id) notFound();

  const [shares, evidenceRows, approver, newerSnapshots] = await Promise.all([
    db
      .select()
      .from(shareLinks)
      .where(and(eq(shareLinks.companyId, id), eq(shareLinks.snapshotId, snapshotId), isNull(shareLinks.revokedAt))),
    db.select({ id: evidence.id }).from(evidence).where(eq(evidence.companyId, id)),
    db.query.userCompanies.findFirst({ where: eq(userCompanies.clerkId, snap.createdBy) }),
    db.select({ id: snapshots.id, label: snapshots.label, createdAt: snapshots.createdAt })
      .from(snapshots)
      .where(eq(snapshots.companyId, id))
      .orderBy(desc(snapshots.createdAt)),
  ]);

  const totals = snap.totals as SnapshotTotals;
  const isLatest = newerSnapshots[0]?.id === snap.id;
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const FORMATS: { key: string; label: string; note: string }[] = [
    { key: "sb253", label: "SB 253", note: "CARB draft format" },
    { key: "excel", label: "Excel", note: "plain spreadsheet" },
    { key: "questionnaire", label: "Questionnaire", note: "buyer CSV" },
    { key: "pact", label: "PACT V3", note: "interop draft" },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <BackLink href={`/consultant/clients/${id}`} label={company.name} />

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display" style={{ color: "var(--text)" }}>
            Snapshot — {company.name}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {snap.label}
            {!isLatest && " · superseded by a newer snapshot"}
          </p>
        </div>
        <span className="chip">Locked · {fmtDate(snap.createdAt)}</span>
      </div>

      {/* Scope cards */}
      <div className="mb-4 grid grid-cols-3 gap-4">
        {[
          ["Scope 1", totals.scope1],
          ["Scope 2", totals.scope2Location],
          ["Scope 3", totals.scope3],
        ].map(([label, val]) => (
          <div key={label as string} className="card-inner text-center">
            <p className="eyebrow">{label}</p>
            <p className="mt-2 font-data text-2xl font-bold" style={{ color: "var(--text)" }}>
              {fmt(val as number)} <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>tCO2e</span>
            </p>
          </div>
        ))}
      </div>

      <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>
        Calculated from approved line items (see Review &amp; Approve) using stored methodology + emission factors ·
        total <span className="font-data font-semibold" style={{ color: "var(--text)" }}>{fmt(totals.total)} tCO2e</span>
        {totals.scope2Market > 0 && ` · Scope 2 market-based ${fmt(totals.scope2Market)} t`}
      </p>
      <p className="mb-6 text-xs" style={{ color: "var(--text-muted)" }}>
        Evidence on file ({evidenceRows.length} file{evidenceRows.length !== 1 ? "s" : ""}) · {snap.itemCount} frozen line items ·
        approved by {approver?.name ?? "you"} on {fmtDate(snap.createdAt)} ·{" "}
        <span className="font-data">sha256 {snap.sha256.slice(0, 12)}…</span>
      </p>

      {/* Share panel */}
      <div className="card mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
          Share this snapshot
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="label text-xs">Download in a format</p>
            <div className="flex flex-wrap gap-2">
              {FORMATS.map((f) => (
                <a
                  key={f.key}
                  href={`/api/snapshots/${snap.id}/export?format=${f.key}`}
                  className="rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
                  style={{ background: "var(--primary-tint)", color: "var(--primary)", border: "1px solid var(--chip-border)" }}
                  title={f.note}
                >
                  {f.label} ↓
                </a>
              ))}
            </div>
            <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
              More formats live in the{" "}
              <Link href="/consultant/formats" className="underline" style={{ color: "var(--primary)" }}>
                format library
              </Link>
              .
            </p>
          </div>

          <div>
            <p className="label text-xs">Send a live link</p>
            <form action={shareSnapshot.bind(null, id, snap.id)} className="space-y-2">
              <input name="recipient_label" placeholder="Recipient — e.g. Elena Ruiz, Northgate Retail" className="input text-xs" />
              <input name="recipient_email" type="email" placeholder="their@email.com" className="input text-xs" />
              <button className="btn btn-primary w-full text-sm">Confirm &amp; share</button>
            </form>
            <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
              Recipients see this frozen version only — never live data.
            </p>
          </div>
        </div>

        {shares.length > 0 && (
          <div className="mt-5 border-t pt-4" style={{ borderColor: "var(--divider)" }}>
            <p className="label text-xs">Shared with</p>
            <div className="space-y-2">
              {shares.map((sh) => (
                <div key={sh.token} className="flex items-center gap-2 text-xs">
                  <ShareLinkButton token={sh.token} />
                  <span className="truncate" style={{ color: "var(--text-muted)" }}>
                    → {sh.recipientLabel || sh.recipientEmail || "unnamed recipient"} · {fmtDate(sh.createdAt)}
                  </span>
                  <form action={revokeShareLink.bind(null, sh.token, id)}>
                    <button className="transition-opacity hover:opacity-70" style={{ color: "var(--text-muted)" }} title="Revoke">
                      ✕
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Correction path */}
      <div
        className="rounded-2xl px-5 py-4 text-xs"
        style={{ background: "var(--warning-tint)", border: "1px solid var(--warning-border)", color: "var(--warning-strong)" }}
      >
        Found a mistake? Fix the item in{" "}
        <Link href={`/consultant/clients/${id}/review`} className="underline">
          Review &amp; Approve
        </Link>{" "}
        and approve again — a new corrected snapshot is created, this one stays on record, and everyone who received it
        gets a restatement alert automatically.
      </div>
    </div>
  );
}
