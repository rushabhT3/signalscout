import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@signalscout/shared"],
  poweredByHeader: false,
};

export default nextConfig;
