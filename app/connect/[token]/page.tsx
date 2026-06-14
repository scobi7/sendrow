import Link from "next/link";
import { Logo } from "@/components/ui";
import { db } from "@/lib/db";
import { inviteTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { loadCompany } from "@/lib/store";
import { acceptInvite } from "@/lib/actions";
import { auth } from "@clerk/nextjs/server";

export default async function ConnectPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ token }, { error }, { userId }] = await Promise.all([params, searchParams, auth()]);

  const invite = await db.query.inviteTokens.findFirst({
    where: eq(inviteTokens.token, token),
  });

  const expired = !invite || invite.usedAt || new Date(invite.expiresAt) < new Date();

  let company;
  if (invite && !expired) {
    try {
      company = await loadCompany(invite.companyId);
    } catch {
      // company not found
    }
  }

  const boundAccept = acceptInvite.bind(null, token);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 bg-slate-50">
      <Logo />

      <div className="card mt-6 w-full max-w-md">
        {expired ? (
          <>
            <h1 className="text-xl font-bold text-slate-900">Invite link expired</h1>
            <p className="mt-2 text-sm text-slate-500">
              This invite link is no longer valid. Ask your consultant to generate a new one.
            </p>
            <Link href="/login" className="btn-primary mt-5 block text-center">
              Go to login
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-slate-900">
              You&rsquo;ve been invited to GreenTrack
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Your ESG consultant has set up a GreenTrack account for{" "}
              <strong>{company?.name ?? "your company"}</strong>.
              {userId
                ? " Click below to accept the invite and get started."
                : " Create an account or log in to accept."}
            </p>

            {error && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            {userId ? (
              <form action={boundAccept} className="mt-5">
                <button className="btn-primary w-full">Accept Invite & Get Started</button>
              </form>
            ) : (
              <div className="mt-5 space-y-3">
                <Link
                  href={`/signup?redirect_url=/connect/${token}`}
                  className="btn-primary block w-full text-center"
                >
                  Create Account & Accept
                </Link>
                <Link
                  href={`/login?redirect_url=/connect/${token}`}
                  className="btn-secondary block w-full text-center"
                >
                  Log In & Accept
                </Link>
              </div>
            )}

            <p className="mt-4 text-center text-xs text-slate-400">
              This invite link expires on {new Date(invite!.expiresAt).toLocaleDateString()}.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
