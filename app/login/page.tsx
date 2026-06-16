import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 bg-slate-50">
      <SignIn
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            card: "rounded-2xl shadow-sm border border-slate-200",
          },
        }}
        fallbackRedirectUrl="/dashboard"
        signUpUrl="/signup"
      />
    </main>
  );
}
