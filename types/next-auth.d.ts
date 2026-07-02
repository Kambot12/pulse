import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      onboardingComplete: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    onboardingComplete?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    onboardingComplete?: boolean;
  }
}
