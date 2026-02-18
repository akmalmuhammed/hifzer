#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const ROOT = process.cwd();
const TARGETS = ["src", "e2e", "README.md"];
const ALLOWED_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".json", ".md", ".css", ".txt"]);
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "dist", "coverage", "test-results"]);

const SUSPICIOUS = [
  "â€”",
  "â€“",
  "â€˜",
  "â€™",
  "â€œ",
  "â€�",
  "â€¦",
  "â€¢",
  "â†’",
  "Â·",
  "Ã—",
  "\uFFFD",
];

function isAllowedFile(filePath) {
  return ALLOWED_EXT.has(extname(filePath).toLowerCase());
}

function walk(path, out) {
  const stat = statSync(path);
  if (stat.isDirectory()) {
    const name = path.split(/[\\/]/).at(-1);
    if (name && SKIP_DIRS.has(name)) {
      return;
    }

    for (const item of readdirSync(path)) {
      walk(join(path, item), out);
    }
    return;
  }

  if (isAllowedFile(path)) {
    out.push(path);
  }
}

const files = [];
for (const target of TARGETS) {
  const fullPath = join(ROOT, target);
  try {
    walk(fullPath, files);
  } catch {
    // Optional path missing.
  }
}

const issues = [];
for (const file of files) {
  const content = readFileSync(file, "utf8");
  const hit = SUSPICIOUS.find((token) => content.includes(token));
  if (hit) {
    issues.push({ file: relative(ROOT, file), token: hit });
  }
}

if (issues.length > 0) {
  console.error("Encoding check failed. Found suspicious mojibake tokens:\n");
  for (const issue of issues) {
    console.error(`- ${issue.file} (contains '${issue.token}')`);
  }
  process.exit(1);
}

console.log(`Encoding check passed (${files.length} files scanned).`);
