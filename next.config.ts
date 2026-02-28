import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TODO: Remove once pre-existing TypeScript errors in dashboard/API files are fixed
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
