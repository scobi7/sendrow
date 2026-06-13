import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getCompany } from "@/lib/store";
import SetupWizard from "./wizard";

export default function SetupPage() {
  const user = currentUser();
  if (!user) redirect("/login");
  const company = getCompany(user.companyId);
  if (company.setupComplete) redirect("/dashboard");
  return <SetupWizard companyName={company.name} />;
}
