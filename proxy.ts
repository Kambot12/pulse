import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth/config";

const { auth } = NextAuth(authConfig);

const CLINIC_ROLES = new Set(["doctor", "reception", "admin"]);
const CLINIC_PREFIXES = ["/doctor", "/reception", "/admin", "/scan", "/emergencies", "/patient",
  "/approvals", "/queue-board"];
const STUDENT_PREFIXES = ["/dashboard", "/passport", "/profile", "/assistant",
  "/medications", "/appointments", "/queue", "/timeline", "/journal", "/onboarding", "/symptoms", "/settings"];
const PLATFORM_PREFIXES = ["/platform"];
const DEV_PREFIXES = ["/dev"];

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const path = nextUrl.pathname;

  // Segment-aware match so e.g. "/queue" doesn't also match "/queue-board".
  const matches = (prefixes: string[]) => prefixes.some((p) => path === p || path.startsWith(p + "/"));
  const isClinicRoute = matches(CLINIC_PREFIXES);
  const isStudentRoute = matches(STUDENT_PREFIXES);
  const isPlatformRoute = matches(PLATFORM_PREFIXES);
  const isDevRoute = matches(DEV_PREFIXES);
  const isProtected = isClinicRoute || isStudentRoute || isPlatformRoute || isDevRoute;

  // Not signed in → send to login (preserve intended destination)
  if (!session?.user) {
    if (isProtected) {
      const url = new URL("/login", nextUrl);
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const role = session.user.role;

  // Developer: env-based console operator — confined to /dev.
  if (role === "developer") {
    return isDevRoute ? NextResponse.next() : NextResponse.redirect(new URL("/dev", nextUrl));
  }
  // Platform super-admin: runs the platform AND the default clinic. Blocked only
  // from the developer console and the student area.
  if (role === "superadmin") {
    if (isDevRoute) return NextResponse.redirect(new URL("/platform", nextUrl));
    if (isStudentRoute) return NextResponse.redirect(new URL("/doctor", nextUrl));
    return NextResponse.next(); // /platform + all clinic routes allowed
  }
  // Everyone else is blocked from the platform + developer areas.
  if (isPlatformRoute || isDevRoute) {
    return NextResponse.redirect(new URL(CLINIC_ROLES.has(role) ? "/doctor" : "/dashboard", nextUrl));
  }

  // Onboarding completion is enforced in the (student) layout via a DB check,
  // so it stays correct even though JWT claims are cached. Role gating below.
  if (isClinicRoute && !CLINIC_ROLES.has(role)) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }
  if (isStudentRoute && CLINIC_ROLES.has(role)) {
    return NextResponse.redirect(new URL("/doctor", nextUrl));
  }
  // Admin-only area (analytics + staff management): hard-gate at the edge.
  if ((path === "/admin" || path.startsWith("/admin/")) && role !== "admin") {
    return NextResponse.redirect(new URL("/doctor", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // run on everything except static assets, images, the service worker and API auth
    "/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons|.*\\.png$).*)",
  ],
};
