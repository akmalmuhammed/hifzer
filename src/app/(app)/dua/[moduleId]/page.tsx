import { notFound } from "next/navigation";
import { DuaExperienceClient } from "../dua-experience-client";
import { loadDuaPageData, resolveDuaModuleId } from "../dua-page-data";

type DuaModulePageProps = {
  params: Promise<{ moduleId: string }>;
};

export default async function DuaModulePage(props: DuaModulePageProps) {
  const { moduleId } = await props.params;
  const resolvedModuleId = resolveDuaModuleId(moduleId);
  if (!resolvedModuleId) {
    notFound();
  }

  const state = await loadDuaPageData();

  return (
    <DuaExperienceClient
      initialView="experience"
      initialModuleId={resolvedModuleId}
      canManageCustomDuas={Boolean(state.userId)}
      initialCustomDuas={state.customDuas}
      initialDeckOrders={state.deckOrders}
    />
  );
}
