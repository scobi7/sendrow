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
  "/terms(.*)",
  "/privacy(.*)",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

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
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
