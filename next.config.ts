import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Store logos / ad images are admin-supplied URLs from arbitrary hosts.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
