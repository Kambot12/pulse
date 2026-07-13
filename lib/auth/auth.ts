import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./config";
import { dbConnect } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import { devEmail, checkDevCredentials } from "@/lib/dev/auth";

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (creds) => {
        const email = String(creds?.email ?? "").toLowerCase().trim();
        const password = String(creds?.password ?? "");
        if (!email || !password) return null;

        // Developer: env-based, no DB account. Recognized right here so it works
        // even against an empty database.
        if (email === devEmail()) {
          if (!checkDevCredentials(email, password)) return null;
          return { id: "developer", email, name: "Developer", role: "developer", orgId: null, onboardingComplete: true, mustChangePassword: false };
        }

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
          orgId: user.orgId ? user.orgId.toString() : null,
          onboardingComplete: user.onboardingComplete,
          mustChangePassword: user.mustChangePassword ?? false,
        };
      },
    }),
  ],
});
