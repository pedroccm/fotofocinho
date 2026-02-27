import type { NextConfig } from "next";
import { resolve } from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: resolve(__dirname),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
};

export default nextConfig;
