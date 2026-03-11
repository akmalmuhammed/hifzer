import { auth } from "@clerk/nextjs/server";
import { listDuaDeckState } from "@/hifzer/ramadan/custom-dua.server";
import { buildDuaModules, type DuaModuleId } from "@/hifzer/ramadan/laylat-al-qadr";
import { clerkEnabled } from "@/lib/clerk-config";

export async function loadDuaPageData() {
  const authEnabled = clerkEnabled();
  const userId = authEnabled ? (await auth()).userId : null;
  const state = userId
    ? await listDuaDeckState(userId)
    : { customDuas: [], deckOrders: [] };

  return {
    userId,
    customDuas: state.customDuas,
    deckOrders: state.deckOrders,
  };
}

export function resolveDuaModuleId(value: string): DuaModuleId | null {
  const match = buildDuaModules().find((module) => module.id === value);
  return match ? match.id : null;
}
