/** Clerk Backend API helpers for tests (development instance only; see clerkKeys()). */
import { clerkKeys } from "./env";

type ClerkUser = { id: string };

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const { secretKey } = clerkKeys();
  const res = await fetch(`https://api.clerk.com/v1${path}`, {
    method,
    headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Clerk ${method} ${path}: ${res.status} ${JSON.stringify(json).slice(0, 300)}`);
  return json as T;
}

/** Returns the user with this email, creating it on first use. */
export async function ensureUser(email: string, first: string, last: string): Promise<string> {
  const found = await api<ClerkUser[]>("GET", `/users?email_address=${encodeURIComponent(email)}`);
  if (found[0]) return found[0].id;
  const created = await api<ClerkUser>("POST", "/users", {
    email_address: [email],
    first_name: first,
    last_name: last,
    skip_password_requirement: true,
  });
  return created.id;
}

/** One-time sign-in ticket for a user (consumed by window.Clerk in the browser). */
export async function signInToken(userId: string): Promise<string> {
  const { token } = await api<{ token: string }>("POST", "/sign_in_tokens", { user_id: userId, expires_in_seconds: 600 });
  return token;
}

export async function deleteUser(userId: string): Promise<void> {
  await api("DELETE", `/users/${userId}`);
}
