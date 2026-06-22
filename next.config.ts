import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.NGROK_HOST && {
    allowedDevOrigins: [process.env.NGROK_HOST],
  }),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "image.mux.com",
      },
    ],
  },
};

export default nextConfig;
