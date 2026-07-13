import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe base config shared by middleware. Contains NO database or Node-only
 * imports so it can run in the middleware (edge) bundle. The Credentials
 * provider with its DB `authorize` lives in ./auth.ts (Node runtime only).
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? "student";
        token.name = (user as { name?: string }).name ?? "";
        token.orgId = (user as { orgId?: string | null }).orgId ?? null;
        token.onboardingComplete = (user as { onboardingComplete?: boolean }).onboardingComplete ?? false;
        token.mustChangePassword = (user as { mustChangePassword?: boolean }).mustChangePassword ?? false;
      }
      // allow server-side session updates (e.g. after changing password)
      if (trigger === "update" && session) {
        if (typeof session.mustChangePassword === "boolean") token.mustChangePassword = session.mustChangePassword;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "student";
        session.user.name = (token.name as string) ?? "";
        session.user.orgId = (token.orgId as string | null) ?? null;
        session.user.onboardingComplete = Boolean(token.onboardingComplete);
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
