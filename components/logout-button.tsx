"use client";

import { useClerk } from "@clerk/nextjs";

export function LogoutButton() {
  const { signOut } = useClerk();
  return (
    <button
      onClick={() => signOut({ redirectUrl: "/" })}
      className="mt-2 text-xs text-zinc-400 hover:text-red-600 transition-colors"
    >
      Log out
    </button>
  );
}
