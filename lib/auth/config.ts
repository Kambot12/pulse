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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? "student";
        token.onboardingComplete = (user as { onboardingComplete?: boolean }).onboardingComplete ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "student";
        session.user.onboardingComplete = Boolean(token.onboardingComplete);
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
