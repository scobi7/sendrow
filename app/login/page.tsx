import Link from "next/link";
import { Logo } from "@/components/ui";
import { login } from "@/lib/actions";

export default function Login({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <Logo />
      <div className="card mt-6 w-full max-w-md">
        <h1 className="text-xl font-bold text-navy-900">Log in</h1>
        {searchParams.error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{searchParams.error}</p>
        )}
        <form action={login} className="mt-5 space-y-4">
          <div>
            <label className="label">Email</label>
            <input name="email" type="email" required className="input" />
          </div>
          <div>
            <label className="label">Password</label>
            <input name="password" type="password" required className="input" />
          </div>
          <button type="submit" className="btn-primary w-full">Log in</button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          New to GreenTrack?{" "}
          <Link href="/signup" className="font-medium text-brand-700 hover:underline">Create an account</Link>
        </p>
      </div>
    </main>
  );
}
