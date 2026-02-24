import { describe, expect, it } from "vitest";
import enSahihByAyahId from "@/hifzer/quran/data/translations/en.sahih.by-ayah-id.json";
import urJunagarhiByAyahId from "@/hifzer/quran/data/translations/ur.junagarhi.by-ayah-id.json";
import idIndonesianByAyahId from "@/hifzer/quran/data/translations/id.indonesian.by-ayah-id.json";
import trYildirimByAyahId from "@/hifzer/quran/data/translations/tr.yildirim.by-ayah-id.json";
import faFooladvandByAyahId from "@/hifzer/quran/data/translations/fa.fooladvand.by-ayah-id.json";
import bnBengaliByAyahId from "@/hifzer/quran/data/translations/bn.bengali.by-ayah-id.json";
import mlAbdulhameedByAyahId from "@/hifzer/quran/data/translations/ml.abdulhameed.by-ayah-id.json";
import {
  getPhoneticByAyahId,
  getQuranTranslationByAyahId,
  getSahihTranslationByAyahId,
  listQuranTranslationsForAyahIds,
  listSahihTranslationsForAyahIds,
} from "@/hifzer/quran/translation.server";

describe("quran/translation.server", () => {
  it("bundles 6236 rows for each configured translation dataset", () => {
    const allDatasets = [
      enSahihByAyahId,
      urJunagarhiByAyahId,
      idIndonesianByAyahId,
      trYildirimByAyahId,
      faFooladvandByAyahId,
      bnBengaliByAyahId,
      mlAbdulhameedByAyahId,
    ] as const;

    for (const dataset of allDatasets) {
      const rows = dataset as unknown as string[];
      expect(rows).toHaveLength(6236);
      for (let idx = 0; idx < rows.length; idx += 1) {
        expect(typeof rows[idx]).toBe("string");
        expect(rows[idx]?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("looks up first and last ayah translation", () => {
    const first = getSahihTranslationByAyahId(1);
    const last = getSahihTranslationByAyahId(6236);
    expect(first).toBe("In the name of Allah, the Entirely Merciful, the Especially Merciful.");
    expect(last).toBe('From among the jinn and mankind."');
  });

  it("returns null for out-of-range ayah ids", () => {
    expect(getSahihTranslationByAyahId(0)).toBeNull();
    expect(getSahihTranslationByAyahId(6237)).toBeNull();
  });

  it("returns translation map for requested ayah IDs", () => {
    const result = listSahihTranslationsForAyahIds([1, 2, 6236, 7000, 1]);
    expect(result[1]).toBe("In the name of Allah, the Entirely Merciful, the Especially Merciful.");
    expect(result[2]).toBe("[All] praise is [due] to Allah, Lord of the worlds -");
    expect(result[6236]).toBe('From among the jinn and mankind."');
    expect(result[7000]).toBeUndefined();
    expect(Object.keys(result)).toHaveLength(3);
  });

  it("uses selected language dataset for Quran translation lookup", () => {
    expect(getQuranTranslationByAyahId(1, "ur.junagarhi")).toBe(
      "شروع کرتا ہوں اللہ تعالیٰ کے نام سے جو بڑا مہربان نہایت رحم واﻻ ہے",
    );
    expect(getQuranTranslationByAyahId(1, "id.indonesian")).toBe(
      "Dengan menyebut nama Allah Yang Maha Pemurah lagi Maha Penyayang.",
    );
    expect(getQuranTranslationByAyahId(1, "tr.yildirim")).toBe(
      "Rahmân ve rahîm olan Allah'ın adıyla [59,22-24]",
    );
    expect(getQuranTranslationByAyahId(1, "fa.fooladvand")).toBe("به نام خداوند رحمتگر مهربان");
    expect(getQuranTranslationByAyahId(1, "bn.bengali")).toBe(
      "শুরু করছি আল্লাহর নামে যিনি পরম করুণাময়, অতি দয়ালু।",
    );
    expect(getQuranTranslationByAyahId(1, "ml.abdulhameed")).toBe(
      "പരമകാരുണികനും കരുണാനിധിയുമായ അല്ലാഹുവിന്റെ നാമത്തില്‍ .",
    );
  });

  it("returns selected-language translation map for requested ayah IDs", () => {
    const result = listQuranTranslationsForAyahIds([1, 2, 7000, 1], "id.indonesian");
    expect(result[1]).toBe("Dengan menyebut nama Allah Yang Maha Pemurah lagi Maha Penyayang.");
    expect(result[2]).toBe("Segala puji bagi Allah, Tuhan semesta alam.");
    expect(result[7000]).toBeUndefined();
    expect(Object.keys(result)).toHaveLength(2);
  });

  it("strips transliteration markup when resolving phonetic text", () => {
    const phonetic = getPhoneticByAyahId(1);
    expect(phonetic).toBe("Bismi Allahi alrrahmani alrraheemi");
    expect(phonetic).not.toContain("<");
  });
});
