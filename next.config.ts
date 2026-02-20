import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

function unique(values: Array<string | null | undefined>): string[] {
  const out = new Set<string>();
  for (const value of values) {
    if (!value) {
      continue;
    }
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      continue;
    }
    out.add(trimmed);
  }
  return [...out];
}

function toHttpOrigin(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

function frontendApiToOrigin(value: string): string | null {
  const cleaned = value.trim().replace(/\$$/, "");
  if (!cleaned) {
    return null;
  }
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(cleaned)
    ? cleaned
    : `https://${cleaned}`;
  return toHttpOrigin(withScheme);
}

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

function getClerkFrontendApiOriginFromPublishableKey(): string | null {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()
    || process.env.CLERK_PUBLISHABLE_KEY?.trim();
  if (!publishableKey) {
    return null;
  }

  const match = /^pk_(?:test|live)_(.+)$/.exec(publishableKey);
  if (!match) {
    return null;
  }

  const encodedFrontendApi = match[1].split("$")[0];
  if (!encodedFrontendApi) {
    return null;
  }

  try {
    return frontendApiToOrigin(decodeBase64Url(encodedFrontendApi));
  } catch {
    return null;
  }
}

function getSiteRootDomainOrigin(): string | null {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim()
    || process.env.NEXT_PUBLIC_APP_URL?.trim()
    || "https://hifzer.com";
  const origin = toHttpOrigin(site);
  if (!origin) {
    return null;
  }

  try {
    const host = new URL(origin).hostname;
    const rootDomain = host.replace(/^www\./, "");
    if (!rootDomain) {
      return null;
    }
    return `https://clerk.${rootDomain}`;
  } catch {
    return null;
  }
}

function getSiteRootAccountOrigin(): string | null {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim()
    || process.env.NEXT_PUBLIC_APP_URL?.trim()
    || "https://hifzer.com";
  const origin = toHttpOrigin(site);
  if (!origin) {
    return null;
  }

  try {
    const host = new URL(origin).hostname;
    const rootDomain = host.replace(/^www\./, "");
    if (!rootDomain) {
      return null;
    }
    return `https://accounts.${rootDomain}`;
  } catch {
    return null;
  }
}

const clerkOrigins = unique([
  getClerkFrontendApiOriginFromPublishableKey(),
  getSiteRootDomainOrigin(),
  "https://clerk.hifzer.com",
]);
const clerkAccountOrigins = unique([
  getSiteRootAccountOrigin(),
  "https://accounts.hifzer.com",
]);
const cspScriptSrc = unique([
  "'self'",
  "'unsafe-inline'",
  "https://clerk.com",
  "https://*.clerk.com",
  "https://*.clerk.accounts.dev",
  ...clerkOrigins,
  ...clerkAccountOrigins,
  "https://challenges.cloudflare.com",
  "https://www.googletagmanager.com",
]);
const cspStyleSrc = unique([
  "'self'",
  "'unsafe-inline'",
  "https://fonts.googleapis.com",
  "https://*.clerk.com",
  "https://*.clerk.accounts.dev",
  ...clerkOrigins,
  ...clerkAccountOrigins,
]);
const cspFontSrc = unique([
  "'self'",
  "https://fonts.gstatic.com",
  "data:",
  "https://*.clerk.com",
  "https://*.clerk.accounts.dev",
  ...clerkOrigins,
  ...clerkAccountOrigins,
]);
const cspConnectSrc = unique([
  "'self'",
  "https://*.clerk.accounts.dev",
  "https://*.clerk.com",
  ...clerkOrigins,
  ...clerkAccountOrigins,
  "https://clerk-telemetry.com",
  "https://*.clerk-telemetry.com",
  "https://sentry.io",
  "https://o*.ingest.sentry.io",
  "https://www.googletagmanager.com",
  "https://www.google-analytics.com",
]);
const cspImgSrc = unique([
  "'self'",
  "data:",
  "https://img.clerk.com",
]);
const cspMediaSrc = unique([
  "'self'",
  toHttpOrigin(process.env.NEXT_PUBLIC_HIFZER_AUDIO_BASE_URL?.trim()),
]);
const cspFrameSrc = unique([
  "'self'",
  "https://*.clerk.com",
  "https://*.clerk.accounts.dev",
  "https://challenges.cloudflare.com",
  ...clerkOrigins,
  ...clerkAccountOrigins,
]);

const nextConfig: NextConfig = {
  typedRoutes: false,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
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
              // Keep Clerk working across dev + prod instances (different frontend API hostnames)
              `script-src ${cspScriptSrc.join(" ")}`,
              `style-src ${cspStyleSrc.join(" ")}`,
              `font-src ${cspFontSrc.join(" ")}`,
              `img-src ${cspImgSrc.join(" ")}`,
              `media-src ${cspMediaSrc.join(" ")}`,
              `connect-src ${cspConnectSrc.join(" ")}`,
              "worker-src 'self' blob:",
              `frame-src ${cspFrameSrc.join(" ")}`,
              `form-action 'self' ${[...clerkOrigins, ...clerkAccountOrigins].join(" ")}`,
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
