import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { loadCompany } from "@/lib/store";
import SetupWizard from "./wizard";

export default async function SetupPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!user.companyId) redirect("/onboarding");
  const company = await loadCompany(user.companyId);
  if (company.setupComplete) redirect("/dashboard");
  return <SetupWizard companyName={company.name} />;
}
