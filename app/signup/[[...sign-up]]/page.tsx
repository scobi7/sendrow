import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";

function AuthSkeleton() {
  return (
    <div className="w-full max-w-md rounded-2xl shadow-sm" style={{ background: "var(--card)", minHeight: 420 }} />
  );
}

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6" style={{ background: "var(--bg)" }}>
      <Suspense fallback={<AuthSkeleton />}>
        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full max-w-md",
              card: "rounded-2xl shadow-sm",
            },
          }}
          fallbackRedirectUrl="/onboarding"
          signInUrl="/login"
        />
      </Suspense>
    </main>
  );
}
