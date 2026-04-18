import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { InstallAppBanner } from "@/components/pwa/install-app-banner";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import {
  DocumentPreferencesBootstrap,
  getDefaultHtmlAttributes,
} from "@/components/providers/document-preferences-bootstrap";
import { GoogleAnalytics } from "@/components/telemetry/google-analytics";
import { clerkAuthRoutes } from "@/lib/auth-redirects";
import { clerkEnabled } from "@/lib/clerk-config";
import { appMonoFont, appSansFont } from "@/lib/fonts";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const siteUrl = getSiteUrl();
const defaultHtml = getDefaultHtmlAttributes();
const skipToMainLabel = "Skip to main content";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Hifzer",
    template: "%s | Hifzer",
  },
  description:
    "Keep your place, your review, your duas, and your private notes in one place.",
  applicationName: "Hifzer",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    shortcut: [{ url: "/icon.png" }],
    apple: [{ url: "/apple-icon.png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Hifzer",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
  },
  openGraph: {
    type: "website",
    title: "Hifzer",
    description: "Keep your place, your review, your duas, and your private notes in one place.",
    url: "/",
    siteName: "Hifzer",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hifzer",
    description: "Keep your place, your review, your duas, and your private notes in one place.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const authEnabled = clerkEnabled();
  const content = authEnabled ? (
    <ClerkProvider
      signInUrl={clerkAuthRoutes.signInUrl}
      signUpUrl={clerkAuthRoutes.signUpUrl}
      signInForceRedirectUrl={clerkAuthRoutes.signInForceRedirectUrl}
      signInFallbackRedirectUrl={clerkAuthRoutes.signInFallbackRedirectUrl}
      signUpForceRedirectUrl={clerkAuthRoutes.signUpForceRedirectUrl}
      signUpFallbackRedirectUrl={clerkAuthRoutes.signUpFallbackRedirectUrl}
    >
      {children}
    </ClerkProvider>
  ) : (
    children
  );

  return (
    <html
      lang={defaultHtml.lang}
      dir={defaultHtml.dir}
      data-mode={defaultHtml.mode}
      data-theme={defaultHtml.theme}
      data-accent={defaultHtml.accent}
      className={`${appSansFont.variable} ${appMonoFont.variable}`}
      style={{ colorScheme: defaultHtml.mode }}
      suppressHydrationWarning
    >
      <body className="kw-canvas min-h-dvh bg-[color:var(--kw-bg)] text-[color:var(--kw-ink)] antialiased">
        <DocumentPreferencesBootstrap />
        <a
          href="#main-content"
          className="sr-only rounded-md bg-[color:var(--kw-ink)] px-3 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[1000]"
        >
          {skipToMainLabel}
        </a>
        {content}
        <InstallAppBanner />
        <ServiceWorkerRegistration />
        <GoogleAnalytics />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
