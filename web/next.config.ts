import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: false,

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;