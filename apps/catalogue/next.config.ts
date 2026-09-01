import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@metland/design-system", "@metland/ui", "@metland/db", "@metland/auth", "@metland/validators"],
  turbopack: { root: "../../" },
};

export default nextConfig;
