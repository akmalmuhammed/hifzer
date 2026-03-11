import { DuaExperienceClient } from "./dua-experience-client";
import { loadDuaPageData } from "./dua-page-data";

export const metadata = {
  title: "Dua",
};

export default async function DuaPage() {
  const state = await loadDuaPageData();

  return (
    <DuaExperienceClient
      initialView="home"
      canManageCustomDuas={Boolean(state.userId)}
      initialCustomDuas={state.customDuas}
      initialDeckOrders={state.deckOrders}
    />
  );
}
