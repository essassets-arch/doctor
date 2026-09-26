import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/opd/:path*',
        destination: '/:path*',
      },
    ];
  },
};

export default nextConfig;
