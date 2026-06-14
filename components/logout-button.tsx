"use client";

import { logout } from "@/lib/actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button className="mt-2 text-xs text-zinc-400 hover:text-red-600 transition-colors">
        Log out
      </button>
    </form>
  );
}
