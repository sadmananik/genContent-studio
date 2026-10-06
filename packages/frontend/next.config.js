/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.FRONTEND_INTEGRATION_TEST === "true" ? ".next-integration" : ".next",
  eslint: {
    ignoreDuringBuilds: true
  },
  reactStrictMode: true
};

module.exports = nextConfig;
