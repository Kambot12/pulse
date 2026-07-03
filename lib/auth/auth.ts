import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./config";
import { dbConnect } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (creds) => {
        const email = String(creds?.email ?? "").toLowerCase().trim();
        const password = String(creds?.password ?? "");
        if (!email || !password) return null;

        await dbConnect();
        const user = await User.findOne({ email });
        if (!user || user.disabled) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name || "",
          role: user.role,
          onboardingComplete: user.onboardingComplete,
          mustChangePassword: user.mustChangePassword ?? false,
        };
      },
    }),
  ],
});
