import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "platform-lookaside.fbsbx.com",
      },
      {
        protocol: "https",
        hostname: "graph.facebook.com",
      },
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
