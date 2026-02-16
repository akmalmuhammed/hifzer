import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const repoRoot = path.resolve(import.meta.dirname, "..");
const inputPath = path.join(repoRoot, "src", "hifzer", "quran", "data", "quran-data.js");
const outputPath = path.join(repoRoot, "src", "hifzer", "quran", "data", "surah-index.ts");

const raw = fs.readFileSync(inputPath, "utf8");

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(raw, sandbox, { filename: "quran-data.js" });

if (!sandbox.QuranData || !Array.isArray(sandbox.QuranData.Sura)) {
  throw new Error("Failed to load QuranData.Sura from quran-data.js");
}

/** @type {any[]} */
const sura = sandbox.QuranData.Sura;

function fixArabicName(value) {
  const s = String(value);
  // quran-data.js in some seed packs ships with UTF-8 Arabic names mis-decoded as Latin-1.
  // Example: "Ø§Ù„ÙØ§ØªØ­Ø©" -> "الفاتحة"
  if (!/[ØÙ]/.test(s)) {
    return s;
  }
  const fixed = Buffer.from(s, "latin1").toString("utf8");
  return /[\u0600-\u06FF]/.test(fixed) ? fixed : s;
}

const rows = [];
for (let surahNumber = 1; surahNumber <= 114; surahNumber += 1) {
  const entry = sura[surahNumber];
  if (!Array.isArray(entry) || entry.length < 8) {
    throw new Error(`Invalid QuranData.Sura[${surahNumber}]`);
  }
  const [start0, ayahCount, order, rukus, nameArabic, nameTransliteration, nameEnglish, type] =
    entry;
  const startAyahId = Number(start0) + 1;
  const endAyahId = startAyahId + Number(ayahCount) - 1;
  rows.push({
    surahNumber,
    startAyahId,
    endAyahId,
    ayahCount: Number(ayahCount),
    order: Number(order),
    rukus: Number(rukus),
    nameArabic: fixArabicName(nameArabic),
    nameTransliteration: String(nameTransliteration),
    nameEnglish: String(nameEnglish),
    revelationType: String(type),
  });
}

const out = `// Generated from src/hifzer/quran/data/quran-data.js (Tanzil metadata).
// Do not edit by hand; run: node scripts/generate-surah-index.mjs

export type SurahIndexRow = {
  surahNumber: number;
  startAyahId: number;
  endAyahId: number;
  ayahCount: number;
  order: number;
  rukus: number;
  nameArabic: string;
  nameTransliteration: string;
  nameEnglish: string;
  revelationType: string;
};

export const SURAH_INDEX: SurahIndexRow[] = ${JSON.stringify(rows, null, 2)};
`;

fs.writeFileSync(outputPath, out, "utf8");
console.log(`Wrote ${rows.length} surah rows to ${path.relative(repoRoot, outputPath)}`);
