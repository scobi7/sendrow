import Link from "next/link";
import { Logo } from "@/components/ui";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center gap-6">
        <Logo />
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Admin</span>
        <nav className="flex gap-4 ml-4">
          <Link href="/admin/factors" className="text-sm font-medium text-slate-600 hover:text-slate-900">Emission Factors</Link>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-8 py-10">{children}</main>
    </div>
  );
}
