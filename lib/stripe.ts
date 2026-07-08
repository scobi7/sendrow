import Stripe from "stripe";

// Lazy: Stripe's constructor throws without a key, which would break builds
// in environments where billing is dormant (no STRIPE_SECRET_KEY).
let _stripe: Stripe | null = null;
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    _stripe ??= new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
    return _stripe[prop as keyof Stripe];
  },
});

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
  const redirectTo = "/consultant";

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
