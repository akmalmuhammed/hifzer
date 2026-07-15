import {
  Amiri,
  IBM_Plex_Mono,
  Inter,
  Plus_Jakarta_Sans,
} from "next/font/google";

export const appSansFont = Inter({
  variable: "--font-kw-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const appMonoFont = IBM_Plex_Mono({
  variable: "--font-kw-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  preload: false,
});

export const quranFont = Amiri({
  variable: "--font-quran-uthmani",
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
  preload: false,
});

export const marketingDisplayFont = Plus_Jakarta_Sans({
  variable: "--font-kw-marketing",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});
