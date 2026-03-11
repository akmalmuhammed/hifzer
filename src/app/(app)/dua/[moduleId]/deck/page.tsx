import { notFound } from "next/navigation";
import { DuaExperienceClient } from "../../dua-experience-client";
import { loadDuaPageData, resolveDuaModuleId } from "../../dua-page-data";

type DuaDeckPageProps = {
  params: Promise<{ moduleId: string }>;
};

export default async function DuaDeckPage(props: DuaDeckPageProps) {
  const { moduleId } = await props.params;
  const resolvedModuleId = resolveDuaModuleId(moduleId);
  if (!resolvedModuleId) {
    notFound();
  }

  const state = await loadDuaPageData();

  return (
    <DuaExperienceClient
      initialView="manage"
      initialModuleId={resolvedModuleId}
      canManageCustomDuas={Boolean(state.userId)}
      initialCustomDuas={state.customDuas}
      initialDeckOrders={state.deckOrders}
    />
  );
}
