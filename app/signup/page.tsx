import { SignUp } from "@clerk/nextjs";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 bg-slate-50">
      <SignUp
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            card: "rounded-2xl shadow-sm border border-slate-200",
          },
        }}
        afterSignUpUrl="/onboarding"
        signInUrl="/login"
      />
    </main>
  );
}
