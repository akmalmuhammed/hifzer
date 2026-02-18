import type { MetadataRoute } from "next";

const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");

const STATIC_ROUTES = [
  "/",
  "/welcome",
  "/compare",
  "/quran-preview",
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
    url: new URL(path, siteUrl).toString(),
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));

  return staticItems;
}
