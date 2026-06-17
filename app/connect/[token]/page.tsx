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
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{ background: "var(--bg)" }}
    >
      <Logo />

      <div className="card mt-6 w-full max-w-md">
        {expired ? (
          <>
            <h1 className="text-xl font-bold font-display" style={{ color: "var(--text)" }}>Invite link expired</h1>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              This invite link is no longer valid. Ask your consultant to generate a new one.
            </p>
            <Link href="/login" className="btn btn-primary mt-5 block text-center">
              Go to login
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold font-display" style={{ color: "var(--text)" }}>
              You&rsquo;ve been invited to GreenTrack
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Your ESG consultant has set up a GreenTrack account for{" "}
              <strong style={{ color: "var(--text)" }}>{company?.name ?? "your company"}</strong>.
              {userId
                ? " Click below to accept the invite and get started."
                : " Create an account or log in to accept."}
            </p>

            {error && (
              <p
                className="mt-3 rounded-lg px-3 py-2 text-sm"
                style={{ background: "var(--danger-tint)", color: "var(--danger)" }}
              >
                {error}
              </p>
            )}

            {userId ? (
              <form action={boundAccept} className="mt-5">
                <button className="btn btn-primary w-full">Accept Invite &amp; Get Started</button>
              </form>
            ) : (
              <div className="mt-5 space-y-3">
                <Link
                  href={`/signup?redirect_url=/connect/${token}`}
                  className="btn btn-primary block w-full text-center"
                >
                  Create Account &amp; Accept
                </Link>
                <Link
                  href={`/login?redirect_url=/connect/${token}`}
                  className="btn btn-secondary block w-full text-center"
                >
                  Log In &amp; Accept
                </Link>
              </div>
            )}

            <p className="mt-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
              This invite link expires on {new Date(invite!.expiresAt).toLocaleDateString()}.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
