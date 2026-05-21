import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["sanitize-html"],
  turbopack: {},
};

export default nextConfig;
