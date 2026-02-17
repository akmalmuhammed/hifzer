import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Spline_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { AppProviders } from "@/components/providers/app-providers";
import { clerkAuthRoutes } from "@/lib/auth-redirects";
import { clerkEnabled } from "@/lib/clerk-config";
import "./globals.css";

const display = Fraunces({
  variable: "--font-kw-display",
  subsets: ["latin"],
});

const sans = Spline_Sans({
  variable: "--font-kw-sans",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-kw-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined;

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Hifzer",
    template: "%s | Hifzer",
  },
  description:
    "Hifzer is a calm system for consistent hifz: plan, practice, and retain with clarity.",
  applicationName: "Hifzer",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    title: "Hifzer",
    description: "A calm system for consistent hifz: plan, practice, and retain with clarity.",
    url: "/",
    siteName: "Hifzer",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hifzer",
    description: "A calm system for consistent hifz: plan, practice, and retain with clarity.",
  },
  robots: {
    index: true,
    follow: true,
  },
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
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body className="kw-canvas min-h-dvh bg-[color:var(--kw-bg)] text-[color:var(--kw-ink)] antialiased">
        <a
          href="#main-content"
          className="sr-only rounded-md bg-[color:var(--kw-ink)] px-3 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[1000]"
        >
          Skip to main content
        </a>
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
      </body>
    </html>
  );
}
