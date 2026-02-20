import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "@playwright/test";
import { clerk, clerkSetup } from "@clerk/testing/playwright";

const BASE_URL = process.env.AUDIT_BASE_URL || "http://localhost:3002";
const OUTPUT_DIR = process.env.AUDIT_OUTPUT_DIR || "test-results/click-audit";
const MAX_ROUTES = Number(process.env.AUDIT_MAX_ROUTES || "90");
const INCLUDE_SIGNED_IN = process.env.AUDIT_INCLUDE_SIGNED_IN === "1" || process.env.CI === "true";
const ROUTES_ARG = process.env.AUDIT_ROUTES;

const DEFAULT_SEED_ROUTES = [
  "/",
  "/pricing",
  "/legal",
  "/legal/terms",
  "/legal/privacy",
  "/legal/refund-policy",
  "/legal/sources",
  "/changelog",
  "/today",
  "/session",
  "/quran",
  "/legacy/app",
  "/legacy/app/goals",
  "/legacy/app/projects",
  "/legacy/app/insights",
  "/legacy/app/team",
  "/legacy/app/settings",
];

function toPath(url) {
  return `${url.pathname}${url.search}`;
}

function unique(items) {
  return Array.from(new Set(items));
}

function getRedirectChain(request) {
  const chain = [];
  let current = request;
  while (current) {
    chain.unshift(current.url());
    current = current.redirectedFrom();
  }
  return chain;
}

function hasSignedInAuditConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      (process.env.CLERK_SECRET_KEY || process.env.CLERK_TESTING_TOKEN) &&
      process.env.E2E_CLERK_TEST_EMAIL,
  );
}

async function ensureSignedIn(page) {
  if (!hasSignedInAuditConfig()) {
    throw new Error(
      "Signed-in click audit requires NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY (or CLERK_TESTING_TOKEN), and E2E_CLERK_TEST_EMAIL.",
    );
  }

  await clerkSetup({ dotenv: true });
  await page.goto("/");
  await clerk.signIn({
    page,
    emailAddress: process.env.E2E_CLERK_TEST_EMAIL,
  });

  await page.evaluate(async () => {
    window.localStorage.setItem("hifzer_onboarding_completed_v1", "1");
    window.localStorage.setItem("hifzer_active_surah_number_v1", "1");
    window.localStorage.setItem("hifzer_cursor_ayah_id_v1", "1");
    await fetch("/api/profile/onboarding-complete", { method: "POST" }).catch(() => null);
  });
}

async function runAudit(mode, seedRoutes) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL: BASE_URL,
  });

  // Keep legacy demo app routable while auditing.
  await context.addInitScript(() => {
    window.localStorage.setItem("kw_demo_user_v1", "user_am");
    window.localStorage.setItem("kw_demo_team_v1", "team_northstar");
  });

  if (mode === "signed_in") {
    const page = await context.newPage();
    await ensureSignedIn(page);
    await page.close();
  }

  const baseOrigin = new URL(BASE_URL).origin;
  const queue = [...unique(seedRoutes)];
  const queued = new Set(queue);
  const visited = new Set();
  const edges = [];
  const routes = [];

  while (queue.length > 0 && visited.size < MAX_ROUTES) {
    const requestedPath = queue.shift();
    queued.delete(requestedPath);

    if (!requestedPath || visited.has(requestedPath)) {
      continue;
    }
    visited.add(requestedPath);

    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const requestFailures = [];

    page.on("console", (message) => {
      if (message.type() === "error") {
        const location = message.location();
        const locationText = location?.url ? `${location.url}:${location.lineNumber ?? 0}` : "unknown";
        consoleErrors.push(`[console.error] ${message.text()} (${locationText})`);
      }
    });
    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });
    page.on("requestfailed", (request) => {
      requestFailures.push(
        `${request.method()} ${request.url()} - ${request.failure()?.errorText ?? "failed"}`,
      );
    });

    let response = null;
    let navigationError = null;
    try {
      response = await page.goto(requestedPath, { waitUntil: "domcontentloaded" });
    } catch (error) {
      navigationError = error instanceof Error ? error.message : String(error);
    }

    const finalUrl = page.url();
    const finalPath = toPath(new URL(finalUrl, BASE_URL));
    const status = response?.status?.() ?? null;
    const redirectChain = response ? getRedirectChain(response.request()) : [];

    const rawLinks = await page.locator("a[href]").evaluateAll((anchors) =>
      anchors.map((anchor) => anchor.getAttribute("href") || ""),
    );

    const outboundLinks = unique(
      rawLinks
        .filter((href) => href && !href.startsWith("#") && !href.startsWith("mailto:") && !href.startsWith("javascript:"))
        .map((href) => new URL(href, baseOrigin).toString())
        .filter((href) => new URL(href).origin === baseOrigin)
        .map((href) => toPath(new URL(href))),
    );

    for (const outbound of outboundLinks) {
      edges.push({ from: requestedPath, to: outbound });
      if (!visited.has(outbound) && !queued.has(outbound) && visited.size + queue.length < MAX_ROUTES) {
        queue.push(outbound);
        queued.add(outbound);
      }
    }

    routes.push({
      requestedPath,
      finalPath,
      finalUrl,
      status,
      redirectChain,
      navigationError,
      consoleErrors,
      pageErrors,
      requestFailures,
      outboundLinks,
    });

    await page.close();
  }

  await context.close();
  await browser.close();

  const totals = {
    visitedRoutes: routes.length,
    discoveredEdges: edges.length,
    routesWithErrors: routes.filter((route) =>
      route.navigationError || route.consoleErrors.length || route.pageErrors.length || route.requestFailures.length,
    ).length,
    pageErrors: routes.reduce((sum, route) => sum + route.pageErrors.length, 0),
    consoleErrors: routes.reduce((sum, route) => sum + route.consoleErrors.length, 0),
    requestFailures: routes.reduce((sum, route) => sum + route.requestFailures.length, 0),
    errorStatusRoutes: routes.filter((route) => typeof route.status === "number" && route.status >= 400).length,
  };

  return {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    mode,
    maxRoutes: MAX_ROUTES,
    seedRoutes,
    totals,
    routes,
    edges,
  };
}

function toMarkdown(report) {
  const lines = [];
  lines.push(`# Click Routing Audit (${report.mode})`);
  lines.push("");
  lines.push(`- Generated: ${report.generatedAt}`);
  lines.push(`- Base URL: ${report.baseUrl}`);
  lines.push(`- Visited routes: ${report.totals.visitedRoutes}`);
  lines.push(`- Discovered edges: ${report.totals.discoveredEdges}`);
  lines.push(`- Routes with errors: ${report.totals.routesWithErrors}`);
  lines.push(`- Console errors: ${report.totals.consoleErrors}`);
  lines.push(`- Page errors: ${report.totals.pageErrors}`);
  lines.push(`- Request failures: ${report.totals.requestFailures}`);
  lines.push(`- 4xx/5xx routes: ${report.totals.errorStatusRoutes}`);
  lines.push("");

  const problematic = report.routes.filter(
    (route) =>
      route.navigationError ||
      route.consoleErrors.length > 0 ||
      route.pageErrors.length > 0 ||
      route.requestFailures.length > 0 ||
      (typeof route.status === "number" && route.status >= 400),
  );

  if (problematic.length === 0) {
    lines.push("No routing/runtime problems detected.");
    return lines.join("\n");
  }

  lines.push("## Problem Routes");
  lines.push("| Requested | Final | Status | Notes |");
  lines.push("|---|---|---:|---|");
  for (const route of problematic.slice(0, 80)) {
    const notes = [
      route.navigationError ? "navigation error" : "",
      route.consoleErrors.length ? `${route.consoleErrors.length} console` : "",
      route.pageErrors.length ? `${route.pageErrors.length} page` : "",
      route.requestFailures.length ? `${route.requestFailures.length} request failures` : "",
    ]
      .filter(Boolean)
      .join(", ");
    lines.push(`| \`${route.requestedPath}\` | \`${route.finalPath}\` | ${route.status ?? "-"} | ${notes || "-"} |`);
  }

  return lines.join("\n");
}

async function writeArtifacts(report) {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const jsonPath = path.join(OUTPUT_DIR, `click-audit.${report.mode}.json`);
  const markdownPath = path.join(OUTPUT_DIR, `click-audit.${report.mode}.md`);
  await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(markdownPath, `${toMarkdown(report)}\n`, "utf8");
  return { jsonPath, markdownPath };
}

async function main() {
  const seedRoutes = ROUTES_ARG
    ? ROUTES_ARG.split(",").map((item) => item.trim()).filter(Boolean)
    : DEFAULT_SEED_ROUTES;

  const modes = ["signed_out"];
  if (INCLUDE_SIGNED_IN) {
    modes.push("signed_in");
  }

  const outputs = [];
  for (const mode of modes) {
    const report = await runAudit(mode, seedRoutes);
    const artifactPaths = await writeArtifacts(report);
    outputs.push({ mode, ...artifactPaths });
  }

  for (const output of outputs) {
    console.log(`[click-audit] ${output.mode}: ${output.jsonPath}`);
    console.log(`[click-audit] ${output.mode}: ${output.markdownPath}`);
  }
}

main().catch((error) => {
  console.error("[click-audit] failed:", error);
  process.exit(1);
});
