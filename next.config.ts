import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  typedRoutes: false,
  async redirects() {
    return [
      {
        source: "/app/:path*",
        destination: "/legacy/app/:path*",
        permanent: false,
      },
      {
        source: "/app",
        destination: "/legacy/app",
        permanent: false,
      },
      {
        source: "/sign-in",
        destination: "/legacy/sign-in",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevents MIME-sniffing attacks
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Prevents clickjacking via iframe embedding
          { key: "X-Frame-Options", value: "DENY" },
          // Controls how much referrer info is sent with requests
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Disable access to sensitive browser APIs not needed by the app
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Force HTTPS for 1 year (only effective when served over HTTPS)
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          // Basic Content-Security-Policy — tightened for Clerk + Sentry
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Next.js requires unsafe-inline for styles; Clerk loads scripts from its CDN
              "script-src 'self' 'unsafe-inline' https://clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https://img.clerk.com",
              "connect-src 'self' https://*.clerk.accounts.dev https://sentry.io https://o*.ingest.sentry.io",
              "frame-src https://challenges.cloudflare.com",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  allowedDevOrigins: [
    "http://localhost",
    "http://127.0.0.1",
    "http://[::1]",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
  ],
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  sourcemaps: {
    disable: true,
  },
});
