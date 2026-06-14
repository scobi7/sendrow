import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { ensureDB, getCompany } from "@/lib/store";
import SetupWizard from "./wizard";

export default async function SetupPage() {
  await ensureDB();
  const user = currentUser();
  if (!user) redirect("/login");
  const company = getCompany(user.companyId);
  if (company.setupComplete) redirect("/dashboard");
  return <SetupWizard companyName={company.name} />;
}
