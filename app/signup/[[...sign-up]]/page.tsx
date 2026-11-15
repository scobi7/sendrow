import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui";

function AuthSkeleton() {
  return (
    <div className="w-full max-w-md rounded" style={{ background: "var(--card)", minHeight: 420 }} />
  );
}

/** Sign-up is invite-only (Clerk Waitlist mode). An invite link arrives with a __clerk_ticket, and
 *  Clerk's later steps use sub-paths (/signup/continue, /signup/verify-...), so only a bare /signup
 *  with no ticket goes to the request form. */
export default async function SignupPage({
  params,
  searchParams,
}: {
  params: Promise<{ "sign-up"?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ "sign-up": step }, query] = await Promise.all([params, searchParams]);
  if (!step?.length && !query.__clerk_ticket) redirect("/request-access");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6" style={{ background: "var(--bg)" }}>
      <Logo />
      <div className="mt-8 flex w-full justify-center">
        <Suspense fallback={<AuthSkeleton />}>
          <SignUp
            appearance={{
              elements: {
                rootBox: "w-full max-w-md",
              },
            }}
            fallbackRedirectUrl="/onboarding"
            signInUrl="/login"
          />
        </Suspense>
      </div>
    </main>
  );
}
