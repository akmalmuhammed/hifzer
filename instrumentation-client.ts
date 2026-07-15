import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const sentryEnabled = Boolean(dsn) && process.env.NODE_ENV === "production";

Sentry.init({
  dsn: dsn || undefined,
  enabled: sentryEnabled,
  tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
