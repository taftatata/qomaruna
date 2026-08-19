import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ["@prisma/client"],
  transpilePackages: ["lucide-react", "framer-motion"],
  webpack: (config) => {
    config.optimization.mangleExports = false;
    return config;
  },
};

export default nextConfig;