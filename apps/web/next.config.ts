import type { NextConfig } from "next";

const PROXY_TARGET_DEV_DEFAULT = "http://localhost:3001";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  distDir: process.env.NEXT_DIST_DIR,
  reactStrictMode: true,
  transpilePackages: ["@mission-atos/config"],
  async headers() {
    const production = process.env.NODE_ENV === "production";
    const developmentApiUrl = process.env.NEXT_PUBLIC_API_URL ?? PROXY_TARGET_DEV_DEFAULT;
    const developmentApiWebSocketUrl = developmentApiUrl.replace(/^http/, "ws");
    const connectSrc = production
      ? "'self' https://viacep.com.br"
      : `'self' ${developmentApiUrl} ${developmentApiWebSocketUrl} https://viacep.com.br`;
    const onVercel = Boolean(process.env.VERCEL_ENV);
    const vercelLive = onVercel
      ? {
          script: " https://vercel.live https://vercel.com",
          connect: " https://vercel.live https://vercel.com wss://*.pusher.com",
          img: " https://vercel.live https://vercel.com",
          frame: " https://vercel.live",
        }
      : { script: "", connect: "", img: "", frame: "" };
    const vlibras = "https://vlibras.gov.br";
    const vlibrasSub = "https://*.vlibras.gov.br";
    const vlibrasCdn = "https://cdn.jsdelivr.net";
    const vercelAnalytics = onVercel ? " https://va.vercel-scripts.com" : "";
    const directives = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${vlibras} ${vlibrasCdn}${vercelLive.script}${vercelAnalytics}`,
      `style-src 'self' 'unsafe-inline' ${vlibras} ${vlibrasCdn}`,
      `img-src 'self' blob: data: ${vlibras} ${vlibrasCdn}${vercelLive.img}`,
      `font-src 'self' data: ${vlibras} ${vlibrasCdn}`,
      `connect-src ${connectSrc} ${vlibras} ${vlibrasSub} ${vlibrasCdn}${vercelLive.connect}`,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      `frame-src 'self' ${vlibras} ${vlibrasCdn}${vercelLive.frame}`,
      `media-src 'self' blob: data: ${vlibras} ${vlibrasSub} ${vlibrasCdn}`,
    ];
    if (production) directives.push("upgrade-insecure-requests");
    return [
      {
        source: "/(.*)",
        headers: [
          ...securityHeaders,
          {
            key: "Content-Security-Policy",
            value: directives.join("; "),
          },
        ],
      },
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
          "point at the absolute API URL.",
      );
      return [];
    }
    const target = rawTarget.replace(/\/$/, "");
    return [{ source: "/api/:path*", destination: `${target}/:path*` }];
  },
};

export default nextConfig;
