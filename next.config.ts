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
