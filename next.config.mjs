/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: ".next-runtime",
  images: {
    unoptimized: true
  },
  experimental: {
    typedRoutes: false
  }
};

export default nextConfig;
