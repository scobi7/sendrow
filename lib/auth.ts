import { auth } from "@clerk/nextjs/server";
import { getUserCompany } from "./store";
import { User } from "./types";

// Returns our app-level User (Clerk ID → company mapping) or null
export async function currentUser(): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) return null;
  return getUserCompany(userId);
}
