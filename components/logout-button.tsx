"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const { signOut } = useClerk();
  const router = useRouter();
  return (
    <button
      className="mt-2 text-xs text-slate-400 hover:text-red-600 transition-colors"
      onClick={() => signOut(() => router.push("/"))}
    >
      Log out
    </button>
  );
}
