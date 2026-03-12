import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(process.env.R2_PUBLIC_DOMAIN
        ? [
            {
              protocol: "https" as const,
              hostname: process.env.R2_PUBLIC_DOMAIN,
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
