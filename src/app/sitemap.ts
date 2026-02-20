import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();

const STATIC_ROUTES = [
  "/",
  "/welcome",
  "/compare",
  "/quran-preview",
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
    url: new URL(path, siteUrl).toString(),
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));

  return staticItems;
}
