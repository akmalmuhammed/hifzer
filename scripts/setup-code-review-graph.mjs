#!/usr/bin/env node

import { spawnSync } from "node:child_process";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
  });

  if (result.error?.code === "ENOENT") {
    return { ok: false, missing: true, stdout: "", stderr: "" };
  }

  if (result.status !== 0) {
    return {
      ok: false,
      missing: false,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
    };
  }

  return {
    ok: true,
    missing: false,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function hasCommand(command) {
  return run(command, ["--version"], { capture: true }).ok;
}

if (!hasCommand("code-review-graph")) {
  if (!hasCommand("pipx")) {
    console.error(
      "code-review-graph is not installed and pipx is unavailable. Install pipx first, then rerun pnpm graph:setup.",
    );
    process.exit(1);
  }

  console.log("Installing code-review-graph with pipx...");
  const install = run("pipx", ["install", "code-review-graph"]);
  if (!install.ok) {
    console.error("Failed to install code-review-graph.");
    process.exit(1);
  }
}

console.log("Registering code-review-graph with Codex for this environment...");
const installCodex = run("code-review-graph", ["install", "--platform", "codex", "--repo", ".", "-y"]);
if (!installCodex.ok) {
  console.error("Failed to register code-review-graph with Codex.");
  process.exit(1);
}

console.log("Building the Hifzer code graph...");
const build = run("code-review-graph", ["build", "--repo", "."]);
if (!build.ok) {
  console.error("Failed to build the Hifzer code graph.");
  process.exit(1);
}

console.log("code-review-graph is ready. Restart Codex so it picks up the MCP server config.");
