import {
  Amiri,
  IBM_Plex_Mono,
  Inter,
} from "next/font/google";

// Inter ships an optical-size axis: large type automatically uses the tighter
// "display" cut, which is the closest match to SF Pro Display off Apple devices.
export const appSansFont = Inter({
  variable: "--font-kw-sans",
  subsets: ["latin"],
  axes: ["opsz"],
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
