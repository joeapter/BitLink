import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "bitlink.co.il",
          },
        ],
        destination: "https://www.bitlink.co.il/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
