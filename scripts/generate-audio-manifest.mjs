#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const args = {
    reciters: ["default"],
    out: "tmp/audio-manifest.csv",
    basePath: null,
    ayahWidth: 6,
    defaultReciter: "alafasy",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--reciters" && argv[i + 1]) {
      args.reciters = argv[i + 1]
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      i += 1;
      continue;
    }
    if (token === "--out" && argv[i + 1]) {
      args.out = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--base-path" && argv[i + 1]) {
      args.basePath = argv[i + 1].replace(/\/+$/, "");
      i += 1;
      continue;
    }
    if (token === "--ayah-width" && argv[i + 1]) {
      const n = Number(argv[i + 1]);
      if (Number.isFinite(n) && n > 0) {
        args.ayahWidth = Math.floor(n);
      }
      i += 1;
      continue;
    }
    if (token === "--default-reciter" && argv[i + 1]) {
      const value = argv[i + 1].trim();
      if (value) {
        args.defaultReciter = value;
      }
      i += 1;
      continue;
    }
  }

  if (!args.reciters.length) {
    args.reciters = ["default"];
  }
  return args;
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (!text.includes(",") && !text.includes("\"") && !text.includes("\n")) {
    return text;
  }
  return `"${text.replaceAll("\"", "\"\"")}"`;
}

function resolveReciterId(reciterId, defaultReciter) {
  return reciterId === "default" ? defaultReciter : reciterId;
}

function formatAyahId(ayahId, width) {
  return String(ayahId).padStart(width, "0");
}

function expectedKey(reciterId, ayahId, ayahWidth, defaultReciter) {
  const publicReciter = resolveReciterId(reciterId, defaultReciter);
  return `${publicReciter}/${formatAyahId(ayahId, ayahWidth)}.mp3`;
}

const args = parseArgs(process.argv.slice(2));
const repoRoot = process.cwd();
const quranSeedPath = path.join(repoRoot, "src", "hifzer", "quran", "data", "ayahs.full.json");

if (!fs.existsSync(quranSeedPath)) {
  console.error(`Could not find Quran seed file at: ${quranSeedPath}`);
  process.exit(1);
}

const ayahs = JSON.parse(fs.readFileSync(quranSeedPath, "utf8"));
if (!Array.isArray(ayahs) || ayahs.length !== 6236) {
  console.error("Seed file did not contain expected 6,236 ayahs.");
  process.exit(1);
}

const rows = [];
rows.push(["reciterId", "publicReciterId", "ayahId", "surahNumber", "ayahNumber", "r2Key", "publicUrlPath"].join(","));

for (const reciterId of args.reciters) {
  for (const ayah of ayahs) {
    const key = expectedKey(reciterId, ayah.id, args.ayahWidth, args.defaultReciter);
    const publicPath = args.basePath ? `${args.basePath}/${key}` : key;
    rows.push(
      [
        reciterId,
        resolveReciterId(reciterId, args.defaultReciter),
        ayah.id,
        ayah.surahNumber,
        ayah.ayahNumber,
        key,
        publicPath,
      ]
        .map(csvEscape)
        .join(","),
    );
  }
}

const outPath = path.resolve(repoRoot, args.out);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${rows.join("\n")}\n`, "utf8");

console.log(`Wrote ${rows.length - 1} rows to ${outPath}`);
console.log(`Reciters: ${args.reciters.join(", ")}`);
console.log(`Default reciter alias: ${args.defaultReciter}`);
console.log(`Ayah filename width: ${args.ayahWidth}`);
console.log("Layout: {reciterId}/{zero-padded-ayahId}.mp3");
