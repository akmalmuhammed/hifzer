import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium, devices } from "@playwright/test";

const ROOT = process.cwd();
const PORT = Number(process.env.MOBILE_AUDIT_PORT || 3120);
const BASE_URL = process.env.MOBILE_AUDIT_BASE_URL || `http://127.0.0.1:${PORT}`;
const WIDTHS = [360, 414];
const HEIGHT = 915;

const ROUTES = [
  { route: "/", surface: "public" },
  { route: "/welcome", surface: "public" },
  { route: "/compare", surface: "public" },
  { route: "/changelog", surface: "public" },
  { route: "/quran-preview", surface: "public" },
  { route: "/legal", surface: "public" },
  { route: "/legal/privacy", surface: "public" },
  { route: "/legal/terms", surface: "public" },
  { route: "/login", surface: "auth" },
  { route: "/signup", surface: "auth" },
  { route: "/forgot-password", surface: "auth" },
  { route: "/today", surface: "app" },
  { route: "/session", surface: "app" },
  { route: "/quran", surface: "app" },
  { route: "/quran/bookmarks", surface: "app" },
  { route: "/quran/glossary", surface: "app" },
  { route: "/quran/juz/1", surface: "app" },
  { route: "/quran/read", surface: "app" },
  { route: "/quran/surah/1", surface: "app" },
  { route: "/dashboard", surface: "app" },
  { route: "/progress", surface: "app" },
  { route: "/progress/map", surface: "app" },
  { route: "/progress/mistakes", surface: "app" },
  { route: "/progress/retention", surface: "app" },
  { route: "/progress/transitions", surface: "app" },
  { route: "/practice", surface: "app" },
  { route: "/milestones", surface: "app" },
  { route: "/notifications", surface: "app" },
  { route: "/streak", surface: "app" },
  { route: "/settings", surface: "app" },
  { route: "/settings/account", surface: "app" },
  { route: "/settings/display", surface: "app" },
  { route: "/settings/plan", surface: "app" },
  { route: "/settings/privacy", surface: "app" },
  { route: "/settings/reciter", surface: "app" },
  { route: "/settings/reminders", surface: "app" },
  { route: "/settings/scoring", surface: "app" },
  { route: "/settings/teacher", surface: "app" },
  { route: "/settings/thresholds", surface: "app" },
  { route: "/support", surface: "app" },
  { route: "/roadmap", surface: "app" },
  { route: "/fluency", surface: "app" },
  { route: "/fluency/lesson/1", surface: "app" },
  { route: "/fluency/retest", surface: "app" },
  { route: "/billing/manage", surface: "app" },
  { route: "/billing/success", surface: "app" },
  { route: "/billing/upgrade", surface: "app" },
];

function pad(value, size) {
  return String(value).padStart(size, " ");
}

async function waitForServer(baseUrl, retries = 80) {
  for (let i = 0; i < retries; i += 1) {
    try {
      const res = await fetch(baseUrl, { method: "GET" });
      if (res.ok || res.status === 307 || res.status === 308 || res.status === 302) {
        return;
      }
    } catch {
      // Retry until timeout.
    }
    await delay(1000);
  }
  throw new Error(`Timed out waiting for dev server at ${baseUrl}`);
}

function spawnDevServer(port) {
  const env = {
    ...process.env,
    HIFZER_TEST_AUTH_BYPASS: "1",
    NODE_ENV: "development",
  };
  if (process.platform === "win32") {
    return spawn("cmd.exe", ["/d", "/s", "/c", `npm run dev -- --port ${port}`], {
      cwd: ROOT,
      env,
      stdio: "pipe",
    });
  }
  return spawn("npm", ["run", "dev", "--", "--port", String(port)], {
    cwd: ROOT,
    env,
    stdio: "pipe",
  });
}

function aggregateByRoute(entries) {
  const grouped = new Map();
  for (const entry of entries) {
    const existing = grouped.get(entry.route) ?? { route: entry.route, surface: entry.surface, results: {} };
    existing.results[entry.width] = entry;
    grouped.set(entry.route, existing);
  }
  return [...grouped.values()];
}

function formatInstallCta(entry) {
  if (!entry) {
    return "n/a";
  }
  return entry.installCtaVisible ? "visible" : "hidden";
}

function formatInstallability(entry) {
  if (!entry) {
    return "n/a";
  }
  if (entry.standaloneMode) {
    return "standalone";
  }
  if (entry.manifestLinked && entry.swControlled) {
    return "manifest+sw";
  }
  if (entry.manifestLinked) {
    return "manifest";
  }
  return "missing";
}

function toMarkdown(entries, generatedAt, baseUrl) {
  const byRoute = aggregateByRoute(entries);
  const lines = [];
  lines.push("# Mobile UI Audit Report");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push("");
  lines.push(`Base URL: \`${baseUrl}\``);
  lines.push("");
  lines.push("## Route Matrix");
  lines.push("");
  lines.push("| Route | Surface | 360px overflow | 414px overflow | 360 CTA | 414 CTA | 360 installability | 414 installability | Final path (360) | Final path (414) |");
  lines.push("| --- | --- | ---: | ---: | --- | --- | --- | --- | --- | --- |");
  for (const row of byRoute) {
    const r360 = row.results[360];
    const r414 = row.results[414];
    lines.push(
      `| \`${row.route}\` | ${row.surface} | ${r360 ? `${r360.overflow}px` : "n/a"} | ${r414 ? `${r414.overflow}px` : "n/a"} | ${formatInstallCta(r360)} | ${formatInstallCta(r414)} | ${formatInstallability(r360)} | ${formatInstallability(r414)} | \`${r360?.path ?? "n/a"}\` | \`${r414?.path ?? "n/a"}\` |`,
    );
  }
  lines.push("");
  lines.push("## Offenders");
  lines.push("");
  const overflowEntries = entries.filter((x) => x.overflow > 0);
  if (!overflowEntries.length) {
    lines.push("- No overflow offenders detected.");
    lines.push("");
  }
  for (const entry of overflowEntries) {
    lines.push(`### ${entry.route} @ ${entry.width}px (overflow ${entry.overflow}px)`);
    lines.push("");
    lines.push(`Final path: \`${entry.path}\``);
    lines.push("");
    lines.push("| Tag | Class | Left | Right | Width |");
    lines.push("| --- | --- | ---: | ---: | ---: |");
    for (const offender of entry.offenders) {
      lines.push(
        `| \`${offender.tag}\` | \`${offender.className || "-"}\` | ${offender.left} | ${offender.right} | ${offender.width} |`,
      );
    }
    lines.push("");
  }

  lines.push("## Add-to-Home Checks");
  lines.push("");
  lines.push("- Top-right compact install control is mounted in app shell (`StreakCornerBadge`) for mobile routes.");
  lines.push("- Sticky bottom install banner is feature-flagged (`NEXT_PUBLIC_INSTALL_BANNER_ENABLED=1`).");
  lines.push("- This headless audit reports CTA visibility as `hidden` until install eligibility (`beforeinstallprompt`/iOS Safari path) is met.");
  lines.push("- iOS path: Share -> Add to Home Screen guidance.");
  lines.push("- Android path: `beforeinstallprompt` trigger when browser eligibility is met.");
  lines.push("");
  lines.push("## Manual QA Matrix");
  lines.push("");
  lines.push("| Device/browser | Portrait | Landscape | Notes |");
  lines.push("| --- | --- | --- | --- |");
  lines.push("| iPhone Safari | Pending | Pending | Validate Share -> Add to Home Screen guidance and safe-area spacing. |");
  lines.push("| Android Chrome | Pending | Pending | Validate prompt path from install CTA when eligible. |");
  lines.push("| Android Edge | Pending | Pending | Validate CTA visibility and no horizontal blank drag. |");
  lines.push("");
  lines.push("## Reproduction Steps");
  lines.push("");
  lines.push("1. Open app on mobile browser (Safari iOS / Chrome Android).");
  lines.push("2. Navigate to `/session`, `/today`, `/quran`, and `/quran/bookmarks`.");
  lines.push("3. Swipe horizontally left/right while near top and mid-page.");
  lines.push("4. Verify no blank canvas is revealed outside page content.");
  lines.push("5. Verify install CTA behavior:");
  lines.push("   - Android: install prompt opens from CTA when eligible.");
  lines.push("   - iOS Safari: install guidance explains Share -> Add to Home Screen.");
  lines.push("");
  return lines.join("\n");
}

async function main() {
  const startedByScript = !process.env.MOBILE_AUDIT_BASE_URL;
  const server = startedByScript ? spawnDevServer(PORT) : null;
  let serverExited = false;

  if (server) {
    server.stdout.on("data", (chunk) => {
      process.stdout.write(`[dev] ${String(chunk)}`);
    });
    server.stderr.on("data", (chunk) => {
      process.stderr.write(`[dev] ${String(chunk)}`);
    });
    server.on("exit", () => {
      serverExited = true;
    });
  }

  try {
    await waitForServer(BASE_URL);
    const browser = await chromium.launch({ headless: true });
    const entries = [];

    for (const width of WIDTHS) {
      const context = await browser.newContext({
        ...devices["Pixel 7"],
        viewport: { width, height: HEIGHT },
      });
      const page = await context.newPage();

      for (const item of ROUTES) {
        const url = `${BASE_URL}${item.route}`;
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });
        await page.waitForTimeout(400);

        const metrics = await page.evaluate(() => {
          const viewport = window.innerWidth;
          const html = document.documentElement;
          const body = document.body;
          const scrollW = Math.max(html.scrollWidth, body?.scrollWidth ?? 0);
          const overflow = Math.max(0, Math.round((scrollW - viewport) * 100) / 100);

          const offenders = [];
          for (const el of Array.from(document.querySelectorAll("*"))) {
            const rect = el.getBoundingClientRect();
            if (!Number.isFinite(rect.left) || !Number.isFinite(rect.right)) {
              continue;
            }
            if (rect.right > viewport + 1 || rect.left < -1) {
              offenders.push({
                tag: el.tagName.toLowerCase(),
                className: String(el.className ?? "").trim().replace(/\s+/g, " ").slice(0, 120),
                left: Math.round(rect.left * 10) / 10,
                right: Math.round(rect.right * 10) / 10,
                width: Math.round(rect.width * 10) / 10,
              });
            }
            if (offenders.length >= 10) {
              break;
            }
          }

          const installSelectors = [
            '[aria-label="Install app"]',
            '[aria-label="Add to Home"]',
            '[aria-label="How to add"]',
            '[aria-label="Install on iPhone"]',
            '[role="region"][aria-label="Install app"]',
          ];
          let installCtaVisible = false;
          for (const selector of installSelectors) {
            for (const el of Array.from(document.querySelectorAll(selector))) {
              const rect = el.getBoundingClientRect();
              const styles = window.getComputedStyle(el);
              const visible = rect.width > 0 &&
                rect.height > 0 &&
                styles.display !== "none" &&
                styles.visibility !== "hidden" &&
                styles.opacity !== "0";
              if (visible) {
                installCtaVisible = true;
                break;
              }
            }
            if (installCtaVisible) {
              break;
            }
          }

          const nav = window.navigator;
          const standaloneMode = window.matchMedia("(display-mode: standalone)").matches || Boolean(nav.standalone);
          const manifestLinked = Boolean(document.querySelector('link[rel="manifest"]'));
          const swControlled = Boolean(window.navigator.serviceWorker && window.navigator.serviceWorker.controller);

          return {
            path: `${location.pathname}${location.search}`,
            viewport,
            scrollW,
            overflow,
            offenders,
            installCtaVisible,
            standaloneMode,
            manifestLinked,
            swControlled,
          };
        });

        entries.push({
          route: item.route,
          surface: item.surface,
          width,
          ...metrics,
        });
        process.stdout.write(
          `[audit] ${pad(width, 3)}px ${item.route.padEnd(28)} overflow=${String(metrics.overflow).padStart(6)} cta=${metrics.installCtaVisible ? "yes" : "no "} install=${formatInstallability(metrics)} path=${metrics.path}\n`,
        );
      }

      await context.close();
    }

    await browser.close();

    const generatedAt = new Date().toISOString();
    const markdown = toMarkdown(entries, generatedAt, BASE_URL);
    const reportPath = path.join(ROOT, "docs", "mobile-ui-audit-report.md");
    await fs.writeFile(reportPath, markdown, "utf8");
    process.stdout.write(`\n[audit] wrote report: ${reportPath}\n`);
  } finally {
    if (server && !serverExited) {
      server.kill("SIGTERM");
      await delay(1200);
      if (!serverExited) {
        server.kill("SIGKILL");
      }
    }
  }
}

main().catch((error) => {
  console.error("[audit] failed:", error);
  process.exitCode = 1;
});
