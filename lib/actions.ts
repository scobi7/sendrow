"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth, currentUser as getClerkUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { companies, userCompanies, consultantClients, referralLeads } from "./db/schema";
import { uid } from "./store";
import { currentUser } from "./auth";
import { findOwnedLink } from "./guards";
import { HeadcountRange, Industry, User } from "./types";
import { createCompanyRecord } from "./newcompany";
import { clientIp, checkRateLimit } from "./ratelimit";
import { sendWelcomeEmail, sendReferralLeadEmail } from "./email";

async function requireConsultant(): Promise<User> {
  const user = await currentUser();
  if (!user || user.role !== "consultant") redirect("/login");
  return user;
}

// ─────────── Onboarding (after Clerk signup) ───────────

export async function onboardAsConsultant() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const clerkUser = await getClerkUser();
  const name = clerkUser?.fullName ?? clerkUser?.firstName ?? "User";
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? "";

  await db
    .insert(userCompanies)
    .values({
      clerkId: userId,
      companyId: null,
      name,
      email,
      role: "consultant",
      createdAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: userCompanies.clerkId,
      set: { companyId: null, name, email, role: "consultant" },
    });

  if (email) sendWelcomeEmail(name, email).catch(() => {});
  redirect("/consultant");
}

// ─────────── Consultant platform ───────────

export async function consultantAddClient(formData: FormData) {
  const consultant = await requireConsultant();
  const name = String(formData.get("name") ?? "").trim();
  const industry = String(formData.get("industry") ?? "") as Industry;
  const headcount = String(formData.get("headcount") ?? "") as HeadcountRange;
  const contactName = String(formData.get("contact_name") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "").trim();
  const naicsCode = String(formData.get("naics") ?? "").trim();

  if (!name) redirect("/consultant/clients/new?error=" + encodeURIComponent("Client name is required."));

  const company = createCompanyRecord(name);
  if (industry) company.industry = industry;
  if (headcount) company.headcountRange = headcount;

  await db.insert(companies).values({
    id: company.id,
    name: company.name,
    industry: company.industry ?? null,
    headcountRange: company.headcountRange ?? null,
    clientContactName: contactName || null,
    clientContactEmail: contactEmail || null,
    naicsCode: naicsCode || null,
    createdAt: company.createdAt,
    setupComplete: false,
    sectionStatus: company.sectionStatus,
  });

  await db.insert(consultantClients).values({
    id: uid("cc_"),
    consultantId: consultant.id,
    companyId: company.id,
    addedAt: new Date().toISOString(),
    archivedAt: null,
  });

  redirect(`/consultant/clients/${company.id}`);
}

export async function updateClientContact(companyId: string, formData: FormData) {
  const consultant = await requireConsultant();
  const link = await findOwnedLink(consultant.id, companyId);
  if (!link) return;

  const contactName = String(formData.get("contact_name") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "").trim();
  await db
    .update(companies)
    .set({ clientContactName: contactName || null, clientContactEmail: contactEmail || null })
    .where(eq(companies.id, companyId));

  revalidatePath(`/consultant/clients/${companyId}`);
  revalidatePath(`/consultant/clients/${companyId}`);
}

export async function archiveClient(companyId: string) {
  const consultant = await requireConsultant();
  await db
    .update(consultantClients)
    .set({ archivedAt: new Date().toISOString() })
    .where(
      and(
        eq(consultantClients.consultantId, consultant.id),
        eq(consultantClients.companyId, companyId)
      )
    );
  redirect("/consultant");
}

export async function deleteClient(companyId: string) {
  const consultant = await requireConsultant();
  await db
    .delete(consultantClients)
    .where(
      and(
        eq(consultantClients.consultantId, consultant.id),
        eq(consultantClients.companyId, companyId)
      )
    );
  redirect("/consultant");
}


// ─────────── Referral routing (Plan J: inbound companies → partner consultants) ───────────

export async function submitReferralLead(formData: FormData) {
  const ip = await clientIp();
  if (!checkRateLimit(`referral:${ip}`)) {
    redirect("/get-matched?error=" + encodeURIComponent("Too many requests - please try again later."));
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const trigger = String(formData.get("trigger") ?? "").trim();

  if (!name || !email || !company) {
    redirect("/get-matched?error=" + encodeURIComponent("Name, email, and company are required."));
  }

  await db.insert(referralLeads).values({
    id: uid("rl_"),
    name,
    email,
    company,
    trigger: trigger || null,
    status: "new",
    createdAt: new Date().toISOString(),
  });

  sendReferralLeadEmail({ name, email, company, trigger }).catch(() => {});
  redirect("/get-matched?submitted=1");
}

