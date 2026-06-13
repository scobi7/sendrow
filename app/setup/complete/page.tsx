import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import { getCompany } from "@/lib/store";

export default async function SetupComplete() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const company = await getCompany(user.companyId);
  if (!company.setupComplete) redirect("/setup");

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center bg-zinc-50 px-6 text-center">
      <Logo />
      <div className="mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-3xl text-brand-600">
        ✓
      </div>
      <h1 className="mt-5 text-2xl font-bold text-navy-900">You&rsquo;re all set, {user.name.split(" ")[0]}</h1>
      <p className="mt-2 text-zinc-500">Connect your accounts, answer a few questions, and we handle the rest.</p>
      <div className="mt-8 grid w-full grid-cols-3 gap-4">
        {[
          ["📊", "GHG Inventory Report"],
          ["🗂️", "Questionnaire Helper"],
          ["🔍", "Audit Trail"],
        ].map(([icon, title]) => (
          <div key={title} className="card py-4 text-center">
            <div className="text-xl">{icon}</div>
            <div className="mt-1 text-xs font-semibold text-zinc-800">{title}</div>
          </div>
        ))}
      </div>
      <Link href="/dashboard" className="btn-primary mt-10 px-8 py-3 text-base shadow-md">
        Go to My Dashboard →
      </Link>
    </main>
  );
}
