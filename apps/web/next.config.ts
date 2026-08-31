import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  reactStrictMode: true,
  transpilePackages: ["@mission-atos/config"],
  async rewrites() {
    const target = (process.env.API_PROXY_TARGET ?? "https://eccosistema-celula.onrender.com").replace(/\/$/, "");
    return [{ source: "/api/:path*", destination: `${target}/:path*` }];
  }
};

export default nextConfig;
