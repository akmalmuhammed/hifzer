import { expect, test, type Page } from "@playwright/test";

async function signInLegacyDemo(page: Page, nextPath = "/legacy/app") {
  await page.goto(`/legacy/sign-in?next=${encodeURIComponent(nextPath)}`);
  await page.evaluate(() => {
    window.localStorage.setItem("kw_demo_user_v1", "user_am");
    window.localStorage.setItem("kw_demo_team_v1", "team_northstar");
  });
  await page.goto(nextPath);
  await expect(page).toHaveURL(new RegExp(`${nextPath.replace(/\//g, "\\/")}(?:\\?|$)`));
}

test.describe("legacy routing", () => {
  test("legacy compatibility redirects from /app* and /sign-in work", async ({ page }) => {
    const routes = [
      { oldPath: "/app", expectedPath: "/legacy/sign-in", expectedNext: "/legacy/app" },
      { oldPath: "/app/goals", expectedPath: "/legacy/sign-in", expectedNext: "/legacy/app/goals" },
      {
        oldPath: "/app/projects/proj_ns_1",
        expectedPath: "/legacy/sign-in",
        expectedNext: "/legacy/app/projects/proj_ns_1",
      },
      { oldPath: "/sign-in", expectedPath: "/legacy/sign-in" },
    ] as const;

    for (const route of routes) {
      await page.goto(route.oldPath);
      await expect(
        page,
        `Expected ${route.oldPath} to redirect to ${route.expectedPath}`,
      ).toHaveURL(new RegExp(`${route.expectedPath.replace(/\//g, "\\/")}`));

      if ("expectedNext" in route) {
        await expect(page.url()).toContain(encodeURIComponent(route.expectedNext));
      }
    }
  });

  test("legacy deep links are routable after sign-in", async ({ page }) => {
    await signInLegacyDemo(page, "/legacy/app/projects/proj_ns_1");
    await expect(page.getByRole("heading", { name: /E2E Stability Program/i })).toBeVisible();
  });

  test("legacy dashboard links resolve without dead routes", async ({ page, baseURL }) => {
    await signInLegacyDemo(page, "/legacy/app");
    const origin = new URL(baseURL ?? "http://localhost:3002").origin;

    const hrefs = await page.locator("a[href]").evaluateAll((anchors) =>
      anchors.map((anchor) => (anchor as HTMLAnchorElement).href),
    );

    const uniqueLegacyPaths = Array.from(
      new Set(
        hrefs
          .map((href) => new URL(href, origin))
          .filter((url) => url.origin === origin && url.pathname.startsWith("/legacy/"))
          .map((url) => `${url.pathname}${url.search}`),
      ),
    );

    for (const path of uniqueLegacyPaths.slice(0, 30)) {
      const response = await page.goto(path);
      expect(response?.status(), `Legacy link returned 404: ${path}`).not.toBe(404);
    }
  });
});
