import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongoose", "bcryptjs"],
  // Pin the workspace root (a stray lockfile exists in the home dir).
  outputFileTracingRoot: process.cwd(),
  turbopack: { root: process.cwd() },
};

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  register: false, // registered manually in components/ServiceWorkerRegister.tsx
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
