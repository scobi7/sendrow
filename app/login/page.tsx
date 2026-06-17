import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6" style={{ background: "var(--bg)" }}>
      <SignIn
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            card: "rounded-2xl shadow-sm",
          },
        }}
        fallbackRedirectUrl="/dashboard"
        signUpUrl="/signup"
      />
    </main>
  );
}
