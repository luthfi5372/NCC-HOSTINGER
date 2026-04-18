import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: 'eslint' key removed — no longer supported in Next.js 16
  // TypeScript build errors are still ignored via tsconfig settings
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
