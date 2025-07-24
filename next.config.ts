import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cmbchtbfgwqenbbpjvtj.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/pool-images/**",
      },
    ],
  },
};

export default nextConfig;
