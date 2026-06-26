import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/for-companies(.*)",
  "/for-consultants(.*)",
  "/pricing(.*)",
  "/demo(.*)",
  "/login(.*)",
  "/signup(.*)",
  "/onboarding(.*)",
  "/connect(.*)",
  "/api/demo(.*)",
  "/api/webhooks/stripe(.*)",
  "/terms(.*)",
  "/privacy(.*)",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

const isAppRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/setup(.*)",
  "/scope(.*)",
  "/connections(.*)",
  "/reports(.*)",
  "/consultant(.*)",
  "/settings(.*)",
  "/governance(.*)",
  "/social(.*)",
  "/gaps(.*)",
  "/report(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  if (isAdminRoute(request)) {
    const { userId } = await auth();
    const adminId = process.env.ADMIN_CLERK_ID;
    if (!adminId || userId !== adminId) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (isAppRoute(request) && process.env.STRIPE_SECRET_KEY) {
    const { userId, sessionClaims } = await auth();
    if (userId) {
      const planStatus = (sessionClaims?.publicMetadata as Record<string, string>)?.planStatus;
      if (planStatus !== "active") {
        return NextResponse.redirect(new URL("/checkout", request.url));
      }
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
