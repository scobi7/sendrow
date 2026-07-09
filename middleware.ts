import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/how-it-works(.*)",
  "/for-companies(.*)",
  "/for-consultants(.*)",
  "/pricing(.*)",
  "/demo(.*)",
  "/login(.*)",
  "/signup(.*)",
  "/sso-callback(.*)",
  "/onboarding(.*)",
  "/api/demo(.*)",
  "/api/webhooks/stripe(.*)",
  "/terms(.*)",
  "/privacy(.*)",
  "/portal(.*)",      // magic-link client portal — token is the auth
  "/api/portal(.*)",  // portal submissions — token validated in the route
  "/security(.*)",
  "/dpa(.*)",
  "/get-matched(.*)",
  "/shared(.*)",   // read-only branded results — token is the auth
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

const isAppRoute = createRouteMatcher([
  "/consultant(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  if (isAdminRoute(request)) {
    const { userId } = await auth();
    const adminId = process.env.ADMIN_CLERK_ID;
    if (!adminId || userId !== adminId) {
      return NextResponse.redirect(new URL("/consultant", request.url));
    }
  }

  // Payment gate disabled during development
  // if (isAppRoute(request) && process.env.STRIPE_SECRET_KEY) {
  //   const { userId, sessionClaims } = await auth();
  //   if (userId && userId !== process.env.ADMIN_CLERK_ID) {
  //     const planStatus = (sessionClaims?.publicMetadata as Record<string, string>)?.planStatus;
  //     if (planStatus !== "active") {
  //       return NextResponse.redirect(new URL("/checkout", request.url));
  //     }
  //   }
  // }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
