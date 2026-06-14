import { auth, currentUser as getClerkUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { userCompanies } from "./db/schema";
import { User } from "./types";

export async function currentUser(): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const record = await db.query.userCompanies.findFirst({
    where: eq(userCompanies.clerkId, userId),
  });
  if (!record) return null;
  return {
    id: record.clerkId,
    name: record.name,
    email: record.email,
    role: record.role as "company" | "consultant",
    companyId: record.companyId ?? "",
    createdAt: record.createdAt,
  };
}

export { getClerkUser };
