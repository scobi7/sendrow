import { redirect } from "next/navigation";
import { auth, currentUser as clerkUser } from "@clerk/nextjs/server";
import { getUserCompany, getCompany, createUserCompany, saveCompany } from "@/lib/store";
import { createCompanyRecord } from "@/lib/newcompany";
import { sendWelcomeEmail } from "@/lib/email";
import SetupWizard from "./wizard";

export default async function SetupPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  let user = await getUserCompany(userId);

  if (!user) {
    // First time this Clerk user hits the app — provision a company for them
    const clerkCurrentUser = await clerkUser();
    const name = clerkCurrentUser?.fullName ?? clerkCurrentUser?.firstName ?? "User";
    const email = clerkCurrentUser?.emailAddresses[0]?.emailAddress ?? "";

    const company = createCompanyRecord("My Company");
    await saveCompany(company);
    await createUserCompany(userId, company.id, name, email);
    sendWelcomeEmail(name, email).catch(() => {});

    user = { id: userId, name, email, companyId: company.id, createdAt: new Date().toISOString() };
  }

  const company = await getCompany(user.companyId);
  if (company.setupComplete) redirect("/dashboard");

  return <SetupWizard />;
}
