import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_SOURCE_URL = "https://tanzil.net/trans/en.sahih";
const repoRoot = path.resolve(import.meta.dirname, "..");
const defaultOutputPath = path.join(
  repoRoot,
  "src",
  "hifzer",
  "quran",
  "data",
  "translations",
  "en.sahih.by-ayah-id.json",
);
const ayahSeedPath = path.join(repoRoot, "src", "hifzer", "quran", "data", "ayahs.full.json");

/**
 * @typedef {{
 *   id: number;
 *   surahNumber: number;
 *   ayahNumber: number;
 * }} AyahSeedRow
 */

/**
 * @typedef {{
 *   surahNumber: number;
 *   ayahNumber: number;
 *   text: string;
 * }} TranslationRow
 */

/**
 * @param {string} raw
 * @returns {TranslationRow[]}
 */
export function parseTanzilTranslationRows(raw) {
  const rows = [];
  const lines = raw.replace(/^\uFEFF/, "").split(/\r?\n/);

  for (const lineRaw of lines) {
    const line = lineRaw.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const match = /^(\d+)\|(\d+)\|(.*)$/.exec(line);
    if (!match) {
      continue;
    }

    const surahNumber = Number(match[1]);
    const ayahNumber = Number(match[2]);
    const text = String(match[3]);

    if (!Number.isFinite(surahNumber) || !Number.isFinite(ayahNumber) || surahNumber < 1 || ayahNumber < 1) {
      throw new Error(`Invalid verse reference: "${line}"`);
    }

    rows.push({ surahNumber, ayahNumber, text });
  }

  return rows;
}

/**
 * @param {TranslationRow[]} rows
 * @param {AyahSeedRow[]} ayahs
 * @returns {string[]}
 */
export function buildTranslationByAyahId(rows, ayahs) {
  if (rows.length !== ayahs.length) {
    throw new Error(`Expected ${ayahs.length} translation rows, got ${rows.length}.`);
  }

  /** @type {Map<string, number>} */
  const ayahIdByKey = new Map();
  for (const ayah of ayahs) {
    const key = `${ayah.surahNumber}:${ayah.ayahNumber}`;
    ayahIdByKey.set(key, ayah.id);
  }

  /** @type {Set<string>} */
  const seenKeys = new Set();
  const byAyahId = new Array(ayahs.length);

  for (const row of rows) {
    const key = `${row.surahNumber}:${row.ayahNumber}`;
    if (seenKeys.has(key)) {
      throw new Error(`Duplicate translation row for ${key}.`);
    }
    seenKeys.add(key);

    const ayahId = ayahIdByKey.get(key);
    if (!ayahId) {
      throw new Error(`Translation row does not map to local ayah seed: ${key}.`);
    }

    byAyahId[ayahId - 1] = row.text;
  }

  for (let idx = 0; idx < byAyahId.length; idx += 1) {
    if (typeof byAyahId[idx] !== "string") {
      throw new Error(`Missing translation for global ayah id ${idx + 1}.`);
    }
  }

  return byAyahId;
}

/**
 * @param {string[]} argv
 * @returns {{ inPath?: string; outPath: string; sourceUrl: string; }}
 */
export function parseArgs(argv) {
  let inPath;
  let outPath = defaultOutputPath;
  let sourceUrl = DEFAULT_SOURCE_URL;

  for (let idx = 0; idx < argv.length; idx += 1) {
    const arg = argv[idx];
    if (arg === "--in") {
      const value = argv[idx + 1];
      if (!value) {
        throw new Error("Missing value for --in");
      }
      inPath = path.resolve(process.cwd(), value);
      idx += 1;
      continue;
    }
    if (arg === "--out") {
      const value = argv[idx + 1];
      if (!value) {
        throw new Error("Missing value for --out");
      }
      outPath = path.resolve(process.cwd(), value);
      idx += 1;
      continue;
    }
    if (arg === "--url") {
      const value = argv[idx + 1];
      if (!value) {
        throw new Error("Missing value for --url");
      }
      sourceUrl = value;
      idx += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return { inPath, outPath, sourceUrl };
}

/**
 * @param {{ inPath?: string; sourceUrl: string }} input
 * @returns {Promise<string>}
 */
export async function readTranslationSource(input) {
  if (input.inPath) {
    return fs.readFileSync(input.inPath, "utf8");
  }

  const response = await fetch(input.sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch translation source: HTTP ${response.status}`);
  }
  return response.text();
}

/**
 * @param {{ inPath?: string; outPath?: string; sourceUrl?: string }} [options]
 * @returns {Promise<{ rows: number; outputPath: string; source: string; }>}
 */
export async function generateSahihTranslation(options = {}) {
  const outPath = options.outPath ?? defaultOutputPath;
  const sourceUrl = options.sourceUrl ?? DEFAULT_SOURCE_URL;
  const source = options.inPath ?? sourceUrl;

  const ayahs = JSON.parse(fs.readFileSync(ayahSeedPath, "utf8"));
  const raw = await readTranslationSource({ inPath: options.inPath, sourceUrl });
  const rows = parseTanzilTranslationRows(raw);
  const byAyahId = buildTranslationByAyahId(rows, ayahs);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(byAyahId, null, 2)}\n`, "utf8");

  return { rows: byAyahId.length, outputPath: outPath, source };
}

/**
 * @param {string[]} argv
 * @returns {Promise<void>}
 */
export async function main(argv) {
  const parsed = parseArgs(argv);
  const result = await generateSahihTranslation(parsed);
  console.log(
    `Wrote ${result.rows} English translation rows to ${path.relative(repoRoot, result.outputPath)} from ${result.source}`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
