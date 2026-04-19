import { NextResponse } from "next/server";
import { loadDuaPageData } from "@/app/(app)/dua/dua-page-data";
import { buildDuaModules } from "@/hifzer/ramadan/laylat-al-qadr";
import { resolveClerkUserIdForServer } from "@/hifzer/testing/request-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await resolveClerkUserIdForServer(request);
  const duaState = await loadDuaPageData(userId).catch(() => ({ userId, customDuas: [], deckOrders: [] }));

  const duaOptions = buildDuaModules({
    customDuas: duaState.customDuas,
    deckOrders: duaState.deckOrders,
  }).flatMap((module) =>
    module.steps.flatMap((step) => {
      if (!step.dua) {
        return [];
      }
      return [
        {
          moduleId: module.id,
          moduleLabel: module.label,
          stepId: step.id,
          title: step.title,
          label: step.dua.label ?? step.eyebrow,
          arabic: step.dua.arabic ?? null,
          transliteration: step.dua.transliteration ?? null,
          translation: step.dua.translation,
          sourceLabel: step.sourceLinks[0]?.label ?? null,
          sourceHref: step.sourceLinks[0]?.href ?? null,
        },
      ];
    }),
  );

  return NextResponse.json({
    ok: true,
    duaOptions,
  });
}
