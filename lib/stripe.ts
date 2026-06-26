import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sendrow.app";

export const PRICE_IDS = {
  company: process.env.STRIPE_COMPANY_PRICE_ID!,
  consultant: process.env.STRIPE_CONSULTANT_PRICE_ID!,
};

export async function createCheckoutSession(
  userId: string,
  plan: "company" | "consultant",
  email?: string
) {
  const redirectTo = plan === "consultant" ? "/consultant" : "/setup";

  const customer = await stripe.customers.create({
    email,
    metadata: { clerkUserId: userId },
  });

  return stripe.checkout.sessions.create({
    customer: customer.id,
    client_reference_id: userId,
    mode: plan === "consultant" ? "subscription" : "payment",
    line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
    metadata: { plan, clerkUserId: userId },
    success_url: `${APP_URL}/checkout/success?redirect=${redirectTo}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/checkout?plan=${plan}&cancelled=1`,
  });
}
