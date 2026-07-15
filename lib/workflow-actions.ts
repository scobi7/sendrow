"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "./db";
import { companies, consultantClients, intakeSessions, requestTemplates } from "./db/schema";
import { currentUser } from "./auth";
import { createDataRequest, createSnapshot, approveSession, flagSession } from "./consultant-actions";
import { logEvent } from "./events";
import type { DataType } from "./ingestion/data-type-templates";

/** Wireframe workflow actions (Plan W): glue between the Figma screens and
 *  the existing engine. All ownership checks live in the callees. */

const VALID_TYPES: DataType[] = ["utility_bills", "fleet_fuel_dollar", "vendor_invoices", "commute_survey", "business_travel"];

/** New Data Request page (#1): standalone form with its own client picker.
 *  Optionally saves the setup as a reusable engagement template (#23). */
export async function createRequestFromPage(formData: FormData) {
  const user = await currentUser();
  if (!user || user.role !== "consultant") return;

  const companyId = String(formData.get("company_id") ?? "");
  if (!companyId) return;

  // The wireframe collects the supplier contact inline - keep it current so
  // the magic link actually lands somewhere.
  const contactEmail = String(formData.get("contact_email") ?? "").trim();
  if (contactEmail) {
    const link = await db.query.consultantClients.findFirst({
      where: and(
        eq(consultantClients.consultantId, user.id),
        eq(consultantClients.companyId, companyId),
        isNull(consultantClients.archivedAt)
      ),
    });
    if (!link) return;
    await db.update(companies).set({ clientContactEmail: contactEmail }).where(eq(companies.id, companyId));
  }

  const dataTypes = VALID_TYPES.filter((t) => formData.get(`type_${t}`) === "on");
  const periodLabel = String(formData.get("period_label") ?? "").trim() || null;
  const dueDate = String(formData.get("due_date") ?? "").trim() || null;
  const description =
    String(formData.get("description") ?? "").trim() ||
    (periodLabel ? `${periodLabel} emissions data` : "Emissions data request");

  if (formData.get("save_as_template") === "on") {
    const dueInDays = dueDate
      ? Math.max(1, Math.round((new Date(dueDate + "T12:00:00").getTime() - Date.now()) / 86_400_000))
      : null;
    await db.insert(requestTemplates).values({
      id: `rt_${crypto.randomUUID().slice(0, 12)}`,
      consultantId: user.id,
      name: description,
      description,
      dataTypes,
      periodLabel,
      dueInDays,
      createdAt: new Date().toISOString(),
    });
  }

  await createDataRequest(companyId, user.id, description, dueDate, dataTypes, periodLabel);
  redirect(`/consultant/clients/${companyId}`);
}

/** Review & Approve (#7): "Approve, freeze & go to snapshot" - one continuous
 *  action, not two. Approves waiting uploads, freezes the snapshot, lands on
 *  Snapshot & Share. */
export async function approveFreezeAndGo(companyId: string, formData: FormData) {
  const user = await currentUser();
  if (!user || user.role !== "consultant") return;
  const link = await db.query.consultantClients.findFirst({
    where: and(
      eq(consultantClients.consultantId, user.id),
      eq(consultantClients.companyId, companyId),
      isNull(consultantClients.archivedAt)
    ),
  });
  if (!link) return;

  const pending = await db
    .select({ id: intakeSessions.id })
    .from(intakeSessions)
    .where(and(eq(intakeSessions.companyId, companyId), inArray(intakeSessions.status, ["pending_review", "needs_info"])));
  for (const s of pending) {
    await approveSession(s.id, companyId);
  }

  const openFlags = Number(formData.get("open_flags") ?? 0);
  const snapshotId = await createSnapshot(companyId, formData);
  if (!snapshotId) return;
  if (openFlags > 0) {
    logEvent({
      companyId, actor: user.id, actorType: "consultant",
      verb: "snapshot.approved_with_flags", subject: `Approved with ${openFlags} open flag${openFlags !== 1 ? "s" : ""}`,
      subjectId: snapshotId, meta: { openFlags },
    });
  }
  redirect(`/consultant/clients/${companyId}/snapshots/${snapshotId}`);
}

/** Review & Approve (#7): "Request changes" - sends the submission back with
 *  a note instead of approving it. */
export async function requestChanges(companyId: string, formData: FormData) {
  const user = await currentUser();
  if (!user || user.role !== "consultant") return;
  const note = String(formData.get("note") ?? "").trim();
  if (!note) return;

  const pending = await db
    .select({ id: intakeSessions.id })
    .from(intakeSessions)
    .where(and(eq(intakeSessions.companyId, companyId), eq(intakeSessions.status, "pending_review")));
  for (const s of pending) {
    await flagSession(s.id, companyId, note);
  }
  logEvent({ companyId, actor: user.id, actorType: "consultant", verb: "review.changes_requested", subject: note });
  revalidatePath(`/consultant/clients/${companyId}/review`);
}
