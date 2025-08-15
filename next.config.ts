import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 1️⃣  — disable ESLint during `next build` */
  eslint: {
    ignoreDuringBuilds: true,
  },

  /* 2️⃣  — disable TypeScript type-checking during `next build` */
  typescript: {
    // ⚠️  PRODUCTION BUILDS WILL SUCCEED EVEN IF YOU HAVE TYPE ERRORS
    ignoreBuildErrors: true,
  },
    images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    
    ],
  },
};

export default nextConfig;
