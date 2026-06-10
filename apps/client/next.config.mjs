const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // wajib untuk pnpm workspace TS package
  transpilePackages: ["@kosalla/shared"],

  async rewrites() {
    return [
      // FE /api/* -> Laravel /api/*
      {
        source: "/api/:path*",
        destination: `${API_BASE}/api/:path*`,
      },

      // Sanctum CSRF cookie
      {
        source: "/sanctum/:path*",
        destination: `${API_BASE}/sanctum/:path*`,
      },

      // akses storage
      {
        source: "/storage/:path*",
        destination: `${API_BASE}/storage/:path*`,
      },
    ];
  },
};

export default nextConfig;
