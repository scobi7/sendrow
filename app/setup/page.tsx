import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getCompany } from "@/lib/store";
import SetupWizard from "./wizard";

export default async function SetupPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const company = await getCompany(user!.companyId);
  if (company.setupComplete) redirect("/dashboard");
  return <SetupWizard companyName={company.name} />;
}
