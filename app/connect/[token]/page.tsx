import Link from "next/link";
import { Logo } from "@/components/ui";
import { ensureDB, loadDB, getCompany } from "@/lib/store";
import { acceptInvite } from "@/lib/actions";

export default async function ConnectPage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { error?: string };
}) {
  await ensureDB();
  const db = loadDB();
  const invite = db.inviteTokens.find(
    (t) => t.token === params.token && !t.usedAt
  );

  const expired = !invite || new Date(invite.expiresAt) < new Date();

  let company;
  let consultantName;
  if (invite) {
    try {
      company = getCompany(invite.companyId);
      const consultant = db.users.find((u) => u.id === invite.consultantId);
      consultantName = consultant?.name ?? "your ESG consultant";
    } catch {
      // company not found
    }
  }

  const boundAccept = acceptInvite.bind(null, params.token);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <Logo />

      <div className="card mt-6 w-full max-w-md">
        {expired ? (
          <>
            <h1 className="text-xl font-bold text-navy-900">Invite link expired</h1>
            <p className="mt-2 text-sm text-slate-500">
              This invite link is no longer valid. Ask your consultant to generate a new one.
            </p>
            <Link href="/login" className="btn-primary mt-5 block text-center">
              Go to login
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-navy-900">
              You've been invited to GreenTrack
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              <strong>{consultantName}</strong> has set up a GreenTrack account for{" "}
              <strong>{company?.name ?? "your company"}</strong>. Create your account to start
              entering your ESG data.
            </p>

            {searchParams.error && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {searchParams.error}
              </p>
            )}

            <form action={boundAccept} className="mt-5 space-y-4">
              <div>
                <label className="label">Your name</label>
                <input name="name" required className="input" placeholder="Jordan Alvarez" />
              </div>
              <div>
                <label className="label">Work email</label>
                <input name="email" type="email" required className="input" />
              </div>
              <div>
                <label className="label">Password (8+ characters)</label>
                <input name="password" type="password" minLength={8} required className="input" />
              </div>
              <button type="submit" className="btn-primary w-full">
                Create Account & Get Started
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-brand-700 hover:underline">
                Log in
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
