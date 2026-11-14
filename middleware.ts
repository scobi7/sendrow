import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/** Sign-in is required only on the app's own sections. Every other path is public, so an unknown
 *  address reaches Next's 404 page instead of a sign-in redirect. A new top-level folder in app/
 *  must be classified in test/middleware-routes.test.ts, which fails until it is. */
const isProtectedRoute = createRouteMatcher([
  "/consultant(.*)",
  "/admin(.*)",
  "/checkout(.*)",
  "/api(.*)",
]);

/** API routes that carry their own auth. */
const isPublicApi = createRouteMatcher([
  "/api/webhooks/stripe(.*)", // Stripe signature checked in the route
  "/api/portal(.*)",  // portal submissions: token validated in the route
  "/api/track(.*)",   // homepage engagement beacon: public, rate-limited, allowlisted events
  "/api/cron(.*)",    // Vercel cron; CRON_SECRET is checked inside the route
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

const isAppRoute = createRouteMatcher([
  "/consultant(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request) && !isPublicApi(request)) {
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
