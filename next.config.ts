/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ["@prisma/client"],
  // Library yang sering memicu error __name
  transpilePackages: ["lucide-react", "framer-motion"],
  webpack: (config) => {
    config.optimization.mangleExports = false;
    return config;
  },
};

export default nextConfig;