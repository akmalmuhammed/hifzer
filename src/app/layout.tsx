import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Mono, Amiri } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { AppProviders } from "@/components/providers/app-providers";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { PublicBetaBanner } from "@/components/site/public-beta-banner";
import { GoogleAnalytics } from "@/components/telemetry/google-analytics";
import { clerkAuthRoutes } from "@/lib/auth-redirects";
import { clerkEnabled } from "@/lib/clerk-config";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const inter = Inter({
  variable: "--font-kw-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-kw-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const amiri = Amiri({
  variable: "--font-quran-uthmani",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Hifzer",
    template: "%s | Hifzer",
  },
  description:
    "Hifzer is the operating system for Qur'an memorization: quality gates, spaced repetition, and a daily plan that enforces retention.",
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
    description: "The operating system for Qur'an memorization: quality gates, spaced repetition, and daily enforcement.",
    url: "/",
    siteName: "Hifzer",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hifzer",
    description: "The operating system for Qur'an memorization: quality gates, spaced repetition, and daily enforcement.",
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
  children: React.ReactNode;
}>) {
  const authEnabled = clerkEnabled();
  return (
    <html
      lang="en"
      data-mode="light"
      data-theme="standard"
      data-accent="teal"
      className={`${inter.variable} ${mono.variable} ${amiri.variable}`}
    >
      <body className="kw-canvas min-h-dvh bg-[color:var(--kw-bg)] text-[color:var(--kw-ink)] antialiased">
        <a
          href="#main-content"
          className="sr-only rounded-md bg-[color:var(--kw-ink)] px-3 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[1000]"
        >
          Skip to main content
        </a>
        <PublicBetaBanner />
        {authEnabled ? (
          <ClerkProvider
            signInUrl={clerkAuthRoutes.signInUrl}
            signUpUrl={clerkAuthRoutes.signUpUrl}
            signInForceRedirectUrl={clerkAuthRoutes.signInForceRedirectUrl}
            signInFallbackRedirectUrl={clerkAuthRoutes.signInFallbackRedirectUrl}
            signUpForceRedirectUrl={clerkAuthRoutes.signUpForceRedirectUrl}
            signUpFallbackRedirectUrl={clerkAuthRoutes.signUpFallbackRedirectUrl}
          >
            <AppProviders>{children}</AppProviders>
          </ClerkProvider>
        ) : (
          <AppProviders>{children}</AppProviders>
        )}
        <ServiceWorkerRegistration />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
