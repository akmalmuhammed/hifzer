import type { MetadataRoute } from "next";
import { SURAH_INDEX } from "@/hifzer/quran/data/surah-index";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const STATIC_ROUTES = [
  "/",
  "/welcome",
  "/pricing",
  "/legal",
  "/legal/terms",
  "/legal/privacy",
  "/legal/refund-policy",
  "/legal/sources",
  "/changelog",
  "/signup",
  "/login",
  "/forgot-password",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticItems: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));

  const surahItems: MetadataRoute.Sitemap = SURAH_INDEX.map((surah) => ({
    url: `${siteUrl}/quran/surah/${surah.surahNumber}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const juzItems: MetadataRoute.Sitemap = Array.from({ length: 30 }, (_, i) => i + 1).map((juzNumber) => ({
    url: `${siteUrl}/quran/juz/${juzNumber}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticItems, ...surahItems, ...juzItems];
}
