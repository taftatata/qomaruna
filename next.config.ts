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
  // Tambahkan framer-motion di sini
  transpilePackages: ["lucide-react", "framer-motion"],
};

export default nextConfig;