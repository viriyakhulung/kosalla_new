import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // 1. Teruskan request FE ke /api/* ke Laravel
      { 
        source: "/api/:path*", 
        destination: "http://localhost:8000/api/:path*" 
      },

      // 2. Untuk Sanctum CSRF cookie
      { 
        source: "/sanctum/:path*", 
        destination: "http://localhost:8000/sanctum/:path*" 
      },

      // 3. Optional: Akses file upload dari Laravel public storage
      { 
        source: "/storage/:path*", 
        destination: "http://localhost:8000/storage/:path*" 
      },
    ];
  },
};

export default nextConfig;