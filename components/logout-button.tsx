"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const { signOut } = useClerk();
  const router = useRouter();
  return (
    <button
      className="mt-2 text-xs hover:underline transition-colors"
      style={{ color: "var(--text-muted)" }}
      onClick={() => signOut(() => router.push("/"))}
    >
      Log out
    </button>
  );
}
