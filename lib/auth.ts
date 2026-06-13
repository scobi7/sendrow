import { cookies } from "next/headers";
import crypto from "crypto";
import { loadDB } from "./store";
import { User } from "./types";

const SECRET = process.env.GT_SECRET || "greentrack-demo-secret-change-in-production";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(candidate));
}

function sign(value: string): string {
  const sig = crypto.createHmac("sha256", SECRET).update(value).digest("hex").slice(0, 32);
  return `${value}.${sig}`;
}

function unsign(signed: string): string | null {
  const i = signed.lastIndexOf(".");
  if (i < 0) return null;
  const value = signed.slice(0, i);
  return sign(value) === signed ? value : null;
}

export function createSession(userId: string) {
  cookies().set("gt_session", sign(userId), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24h per security spec
    path: "/",
  });
}

export function destroySession() {
  cookies().delete("gt_session");
}

export function currentUser(): User | null {
  const raw = cookies().get("gt_session")?.value;
  if (!raw) return null;
  const userId = unsign(raw);
  if (!userId) return null;
  return loadDB().users.find((u) => u.id === userId) ?? null;
}
