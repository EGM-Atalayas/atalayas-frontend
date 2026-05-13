import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage (avatares, portadas de módulos, audio podcast, etc.)
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Backend de Render — sirve uploads legacy
      {
        protocol: "https",
        hostname: "*.onrender.com",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
