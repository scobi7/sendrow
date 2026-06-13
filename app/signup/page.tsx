import Link from "next/link";
import { Logo } from "@/components/ui";
import { signup } from "@/lib/actions";

export default function Signup({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <Logo />
      <div className="card mt-6 w-full max-w-md">
        <h1 className="text-xl font-bold text-navy-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">No credit card required.</p>
        {searchParams.error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{searchParams.error}</p>
        )}
        <form action={signup} className="mt-5 space-y-4">
          <div>
            <label className="label">Your name</label>
            <input name="name" required className="input" placeholder="Jordan Alvarez" />
          </div>
          <div>
            <label className="label">Work email</label>
            <input name="email" type="email" required className="input" placeholder="jordan@company.com" />
          </div>
          <div>
            <label className="label">Company name</label>
            <input name="company" required className="input" placeholder="Pacific Coast Logistics" />
          </div>
          <div>
            <label className="label">Password (8+ characters)</label>
            <input name="password" type="password" minLength={8} required className="input" />
          </div>
          <button type="submit" className="btn-primary w-full">Get Started</button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-700 hover:underline">Log in</Link>
        </p>
      </div>
    </main>
  );
}
