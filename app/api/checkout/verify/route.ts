import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { userCompanies } from "@/lib/db/schema";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  // The session must actually belong to the signed-in user - without this,
  // anyone who obtains any paid session_id (shared link, browser history,
  // a support screenshot) could grant themselves that plan for free.
  if (session.client_reference_id !== userId) {
    return NextResponse.json({ error: "This checkout session doesn't belong to you" }, { status: 403 });
  }

  if (session.payment_status !== "paid" && session.status !== "complete") {
    return NextResponse.json({ error: "Payment not complete" }, { status: 402 });
  }

  const plan = (session.metadata?.plan ?? "company") as "company" | "consultant";

  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: { plan, planStatus: "active" },
    privateMetadata: { stripeCustomerId: session.customer },
  });
  if (session.customer) {
    await db.update(userCompanies).set({ stripeCustomerId: session.customer as string }).where(eq(userCompanies.clerkId, userId));
  }

  return NextResponse.json({ plan, redirect: "/consultant" });
}
