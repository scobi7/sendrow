import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { userCompanies } from "@/lib/db/schema";

export async function GET() {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sendrow.app";
  const { userId } = await auth();
  if (!userId) return NextResponse.redirect(new URL("/login", APP_URL));

  // Read from the DB, not Clerk session claims - privateMetadata isn't
  // included in the session JWT by default, so that read was always undefined.
  const record = await db.query.userCompanies.findFirst({ where: eq(userCompanies.clerkId, userId) });
  const customerId = record?.stripeCustomerId;
  if (!customerId) return NextResponse.redirect(new URL("/checkout", APP_URL));

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${APP_URL}/settings`,
  });

  return NextResponse.redirect(session.url);
}
