import { redirect } from "next/navigation";

/** Paused 2026-10-20: this page described a pre-pivot pricing model (one-time
 *  company report purchase, published consultant $/mo tiers) that contradicts
 *  GOALS.md's current, explicit "pricing deferred until discovery" decision -
 *  and the checkout/payment gate is disabled in middleware.ts, so none of it
 *  could actually be transacted anyway. Redirecting rather than deleting so
 *  the route and any inbound links don't 404; /pricing/agency (a quote-request
 *  form with no hardcoded numbers) stays live. */
export default function PricingPage() {
  redirect("/for-consultants");
}
