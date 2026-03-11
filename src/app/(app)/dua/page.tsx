import { auth } from "@clerk/nextjs/server";
import { listDuaDeckState } from "@/hifzer/ramadan/custom-dua.server";
import { DuaExperienceClient } from "./dua-experience-client";

export const metadata = {
  title: "Dua",
};

export default async function DuaPage() {
  const { userId } = await auth();
  const state = userId
    ? await listDuaDeckState(userId)
    : { customDuas: [], deckOrders: [] };

  return (
    <DuaExperienceClient
      canManageCustomDuas={Boolean(userId)}
      initialCustomDuas={state.customDuas}
      initialDeckOrders={state.deckOrders}
    />
  );
}
