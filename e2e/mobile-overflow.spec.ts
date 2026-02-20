import { expect, test } from "@playwright/test";

const ROUTES = [
  "/",
  "/welcome",
  "/compare",
  "/changelog",
  "/legal",
  "/login",
  "/signup",
  "/forgot-password",
  "/today",
  "/session",
  "/quran",
  "/quran/bookmarks",
  "/quran/glossary",
  "/quran/juz/1",
  "/quran/read",
  "/quran/surah/1",
  "/dashboard",
  "/progress",
  "/progress/map",
  "/progress/mistakes",
  "/progress/retention",
  "/progress/transitions",
  "/streak",
  "/settings",
  "/settings/display",
  "/support",
  "/roadmap",
] as const;

const VIEWPORTS = [360, 414] as const;

for (const width of VIEWPORTS) {
  test(`mobile overflow audit @${width}px`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height: 915 });

    for (const route of ROUTES) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(250);

      const metrics = await page.evaluate(() => {
        const viewport = window.innerWidth;
        const html = document.documentElement;
        const body = document.body;
        const scrollWidth = Math.max(html.scrollWidth, body?.scrollWidth ?? 0);
        const overflow = scrollWidth - viewport;

        const installSelectors = [
          '[aria-label="Install app"]',
          '[aria-label="Add to Home"]',
          '[aria-label="How to add"]',
          '[aria-label="Install app"]',
          '[aria-label="Install on iPhone"]',
          '[aria-label="Install app"]',
          '[role="region"][aria-label="Install app"]',
        ];
        const installBounds = [];
        for (const selector of installSelectors) {
          for (const el of Array.from(document.querySelectorAll(selector))) {
            const rect = el.getBoundingClientRect();
            installBounds.push({
              selector,
              left: rect.left,
              right: rect.right,
              width: rect.width,
            });
          }
        }

        return {
          path: `${location.pathname}${location.search}`,
          viewport,
          scrollWidth,
          overflow,
          installBounds,
        };
      });

      expect(
        metrics.scrollWidth,
        `Route ${route} resolved to ${metrics.path} with overflow=${metrics.overflow}px at viewport ${metrics.viewport}px`,
      ).toBeLessThanOrEqual(metrics.viewport + 1);

      for (const bound of metrics.installBounds) {
        expect(
          bound.right,
          `Install UI (${bound.selector}) overflowed right edge on ${route} -> ${metrics.path}`,
        ).toBeLessThanOrEqual(metrics.viewport + 1);
        expect(
          bound.left,
          `Install UI (${bound.selector}) overflowed left edge on ${route} -> ${metrics.path}`,
        ).toBeGreaterThanOrEqual(-1);
      }
    }
  });
}
