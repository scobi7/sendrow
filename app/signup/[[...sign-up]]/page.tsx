import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";
import { Logo } from "@/components/ui";

function AuthSkeleton() {
  return (
    <div className="w-full max-w-md rounded" style={{ background: "var(--card)", minHeight: 420 }} />
  );
}

export default function SignupPage() {
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
