"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

/** Clerk's OAuth (Google, etc.) redirect lands here to finish the handshake.
 *  Without this page the redirect has nowhere to go and Next.js 404s -
 *  middleware already treats /sso-callback as public, but no page existed. */
export default function SSOCallbackPage() {
  return <AuthenticateWithRedirectCallback signInFallbackRedirectUrl="/onboarding" signUpFallbackRedirectUrl="/onboarding" />;
}
