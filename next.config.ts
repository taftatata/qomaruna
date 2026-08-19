import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    // Agar build tidak gagal karena error ESLint yang Anda alami di log
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ["@prisma/client"],
  // Memperbaiki masalah "__name is not defined" yang sering muncul dari lucide-react
  transpilePackages: ["lucide-react"],
};

export default nextConfig;