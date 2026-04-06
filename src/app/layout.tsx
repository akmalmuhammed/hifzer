import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Fragment } from "react";
import { Inter, IBM_Plex_Mono, Amiri, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { cookies } from "next/headers";
import { AppProviders } from "@/components/providers/app-providers";
import { InstallAppBanner } from "@/components/pwa/install-app-banner";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { GoogleAnalytics } from "@/components/telemetry/google-analytics";
import { DISTRACTION_FREE_COOKIE, normalizeDistractionFree } from "@/hifzer/focus/distraction-free";
import { getAppUiCopy } from "@/hifzer/i18n/app-ui-copy";
import { normalizeUiLanguage, UI_LANGUAGE_COOKIE, uiLanguageToHtmlLang } from "@/hifzer/i18n/ui-language";
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

const marketingDisplay = Plus_Jakarta_Sans({
  variable: "--font-kw-marketing",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Hifzer",
    template: "%s | Hifzer",
  },
  description:
    "A calm Qur'an companion for reading, reciting, and memorizing with structure.",
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
    description: "A calm Qur'an companion for reading, reciting, and memorizing with structure.",
    url: "/",
    siteName: "Hifzer",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hifzer",
    description: "A calm Qur'an companion for reading, reciting, and memorizing with structure.",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const authEnabled = clerkEnabled();
  const ClerkWrapper = authEnabled ? (await import("@clerk/nextjs")).ClerkProvider : Fragment;
  const cookieStore = await cookies();
  const uiLanguage = normalizeUiLanguage(cookieStore.get(UI_LANGUAGE_COOKIE)?.value);
  const distractionFree = normalizeDistractionFree(cookieStore.get(DISTRACTION_FREE_COOKIE)?.value);
  const ui = getAppUiCopy(uiLanguage);
  return (
      <html
        lang={uiLanguageToHtmlLang(uiLanguage)}
        data-mode="light"
        data-theme="standard"
        data-accent="teal"
        className={`${inter.variable} ${mono.variable} ${amiri.variable} ${marketingDisplay.variable}`}
      >
      <body suppressHydrationWarning className="kw-canvas min-h-dvh bg-[color:var(--kw-bg)] text-[color:var(--kw-ink)] antialiased">
        <a
          href="#main-content"
          className="sr-only rounded-md bg-[color:var(--kw-ink)] px-3 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[1000]"
        >
          {ui.skipToMain}
        </a>
        {authEnabled ? (
          <ClerkWrapper
            signInUrl={clerkAuthRoutes.signInUrl}
            signUpUrl={clerkAuthRoutes.signUpUrl}
            signInForceRedirectUrl={clerkAuthRoutes.signInForceRedirectUrl}
            signInFallbackRedirectUrl={clerkAuthRoutes.signInFallbackRedirectUrl}
            signUpForceRedirectUrl={clerkAuthRoutes.signUpForceRedirectUrl}
            signUpFallbackRedirectUrl={clerkAuthRoutes.signUpFallbackRedirectUrl}
          >
            <AppProviders initialUiLanguage={uiLanguage} initialDistractionFree={distractionFree}>{children}</AppProviders>
          </ClerkWrapper>
        ) : (
          <AppProviders initialUiLanguage={uiLanguage} initialDistractionFree={distractionFree}>{children}</AppProviders>
        )}
        <InstallAppBanner />
        <ServiceWorkerRegistration />
        <GoogleAnalytics />
        <Analytics />
      </body>
    </html>
  );
}
