import type { NextConfig } from "next";

const PROXY_TARGET_DEV_DEFAULT = "http://localhost:3001";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
  }
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  reactStrictMode: true,
  transpilePackages: ["@mission-atos/config"],
  async headers() {
    const production = process.env.NODE_ENV === "production";
    const connectSrc = production
      ? "'self'"
      : "'self' http://localhost:3001 ws://localhost:3001";
    const onVercel = Boolean(process.env.VERCEL_ENV);
    const vercelLive = onVercel
      ? {
          script: " https://vercel.live https://vercel.com",
          connect: " https://vercel.live https://vercel.com wss://*.pusher.com",
          img: " https://vercel.live https://vercel.com",
          frame: " https://vercel.live"
        }
      : { script: "", connect: "", img: "", frame: "" };
    const directives = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${vercelLive.script}`,
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' blob: data:${vercelLive.img}`,
      "font-src 'self' data:",
      `connect-src ${connectSrc}${vercelLive.connect}`,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      `frame-src 'self'${vercelLive.frame}`
    ];
    if (production) directives.push("upgrade-insecure-requests");
    return [
      {
        source: "/(.*)",
        headers: [
          ...securityHeaders,
          {
            key: "Content-Security-Policy",
            value: directives.join("; ")
          }
        ]
      }
    ];
  },
  async rewrites() {
    const environment = process.env.NODE_ENV ?? "development";
    const rawTarget =
      process.env.API_PROXY_TARGET ??
      (environment === "production" ? undefined : PROXY_TARGET_DEV_DEFAULT);
    if (!rawTarget) {
      console.error(
        "[next.config] API_PROXY_TARGET is not set in production. " +
          "Requests to /api/* will not be proxied; configure the variable to " +
          "point at the absolute API URL."
      );
      return [];
    }
    const target = rawTarget.replace(/\/$/, "");
    return [{ source: "/api/:path*", destination: `${target}/:path*` }];
  }
};

export default nextConfig;