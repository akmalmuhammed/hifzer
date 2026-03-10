import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { buildTranslationByAyahId } from "./generate-sahih-translation.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const ayahSeedPath = path.join(repoRoot, "src", "hifzer", "quran", "data", "ayahs.full.json");

/**
 * @typedef {{
 *   surahNumber: number;
 *   ayahNumber: number;
 *   text: string;
 * }} TranslationRow
 */

function stripBom(raw) {
  return raw.replace(/^\uFEFF/, "");
}

function normalizeNumber(value) {
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseVerseKey(value) {
  const match = /^(\d+):(\d+)$/.exec(String(value ?? "").trim());
  if (!match) {
    return null;
  }
  const surahNumber = normalizeNumber(match[1]);
  const ayahNumber = normalizeNumber(match[2]);
  if (!surahNumber || !ayahNumber) {
    return null;
  }
  return { surahNumber, ayahNumber };
}

function normalizeTranslationRow(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const row = /** @type {Record<string, unknown>} */ (raw);
  const verseKey = parseVerseKey(
    row.verse_key ?? row.verseKey ?? row.ayah_key ?? row.ayahKey ?? row.key ?? row.reference,
  );
  const surahNumber = verseKey?.surahNumber ?? normalizeNumber(
    row.surah ?? row.surahNumber ?? row.sura ?? row.chapter ?? row.chapter_number,
  );
  const ayahNumber = verseKey?.ayahNumber ?? normalizeNumber(
    row.ayah ?? row.ayahNumber ?? row.aya ?? row.verse ?? row.verse_number,
  );
  const textRaw =
    row.text ??
    row.translation ??
    row.translation_text ??
    row.translationText ??
    row.value ??
    row.content;
  const text = typeof textRaw === "string" ? textRaw.trim() : "";

  if (!surahNumber || !ayahNumber || !text) {
    return null;
  }

  return { surahNumber, ayahNumber, text };
}

function detectDelimiter(headerLine) {
  const candidates = ["\t", "|", ";", ","];
  let best = candidates[0];
  let bestScore = -1;

  for (const delimiter of candidates) {
    const score = headerLine.split(delimiter).length;
    if (score > bestScore) {
      best = delimiter;
      bestScore = score;
    }
  }

  return best;
}

function splitDelimitedRow(line, delimiter) {
  const out = [];
  let current = "";
  let inQuotes = false;

  for (let idx = 0; idx < line.length; idx += 1) {
    const char = line[idx];
    if (char === '"') {
      if (inQuotes && line[idx + 1] === '"') {
        current += '"';
        idx += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (char === delimiter && !inQuotes) {
      out.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  out.push(current);
  return out.map((part) => part.trim());
}

function parseStructuredRows(raw) {
  const parsed = JSON.parse(stripBom(raw));
  const candidates = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.data)
      ? parsed.data
      : Array.isArray(parsed?.rows)
        ? parsed.rows
        : Array.isArray(parsed?.result)
          ? parsed.result
          : null;

  if (!candidates) {
    throw new Error("JSON source does not contain an array of translation rows.");
  }

  const rows = [];
  for (const candidate of candidates) {
    const row = normalizeTranslationRow(candidate);
    if (row) {
      rows.push(row);
    }
  }
  return rows;
}

function parseDelimitedRows(raw) {
  const lines = stripBom(raw)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("Delimited source must include a header row and at least one translation row.");
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitDelimitedRow(lines[0], delimiter);
  const rows = [];

  for (const line of lines.slice(1)) {
    const values = splitDelimitedRow(line, delimiter);
    const candidate = {};
    for (let idx = 0; idx < headers.length; idx += 1) {
      candidate[headers[idx]] = values[idx] ?? "";
    }
    const row = normalizeTranslationRow(candidate);
    if (row) {
      rows.push(row);
    }
  }

  return rows;
}

/**
 * @param {string} raw
 * @returns {TranslationRow[]}
 */
export function parseQuranEncRows(raw) {
  const trimmed = stripBom(raw).trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    return parseStructuredRows(trimmed);
  }

  return parseDelimitedRows(trimmed);
}

/**
 * @param {string[]} argv
 * @returns {{ inPath: string; outPath: string; }}
 */
export function parseArgs(argv) {
  let inPath = "";
  let outPath = "";

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
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!inPath) {
    throw new Error("Missing required --in <file> argument.");
  }
  if (!outPath) {
    throw new Error("Missing required --out <file> argument.");
  }

  return { inPath, outPath };
}

/**
 * @param {{ inPath: string; outPath: string }} options
 * @returns {{ rows: number; outputPath: string; }}
 */
export function importQuranEncTranslation(options) {
  const ayahs = JSON.parse(fs.readFileSync(ayahSeedPath, "utf8"));
  const raw = fs.readFileSync(options.inPath, "utf8");
  const rows = parseQuranEncRows(raw);
  const byAyahId = buildTranslationByAyahId(rows, ayahs);

  fs.mkdirSync(path.dirname(options.outPath), { recursive: true });
  fs.writeFileSync(options.outPath, `${JSON.stringify(byAyahId, null, 2)}\n`, "utf8");

  return { rows: byAyahId.length, outputPath: options.outPath };
}

/**
 * @param {string[]} argv
 * @returns {Promise<void>}
 */
export async function main(argv) {
  const parsed = parseArgs(argv);
  const result = importQuranEncTranslation(parsed);
  console.log(
    `Wrote ${result.rows} translation rows to ${path.relative(repoRoot, result.outputPath)} from ${path.relative(repoRoot, parsed.inPath)}`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
