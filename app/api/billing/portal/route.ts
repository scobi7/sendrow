import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";

export async function GET() {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sendrow.app";
  const { userId, sessionClaims } = await auth();
  if (!userId) return NextResponse.redirect(new URL("/login", APP_URL));

  const customerId = (sessionClaims?.privateMetadata as Record<string, string>)?.stripeCustomerId;
  if (!customerId) return NextResponse.redirect(new URL("/checkout", APP_URL));

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${APP_URL}/settings`,
  });

  return NextResponse.redirect(session.url);
}
