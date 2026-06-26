import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const clerk = await clerkClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;
    const plan = session.metadata?.plan as "company" | "consultant" | undefined;
    if (userId && plan) {
      if (session.customer) {
        await stripe.customers.update(session.customer as string, {
          metadata: { clerkUserId: userId },
        });
      }
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: { plan, planStatus: "active" },
        privateMetadata: { stripeCustomerId: session.customer },
      });
    }
  }

  if (
    event.type === "customer.subscription.deleted" ||
    (event.type === "customer.subscription.updated" &&
      (event.data.object as Stripe.Subscription).status !== "active")
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    const userId = (customer as Stripe.Customer).metadata?.clerkUserId;
    if (userId) {
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: { planStatus: "inactive" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
