import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // This disables Next's optimizer, fixes the PNG issue
    formats: ["image/avif", "image/webp"], // Valid values only
  },
};

export default nextConfig;
