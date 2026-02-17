import OkrDetailPage from "@/_legacy/kw-app-routes/goals/[okrId]/page";

type Params = {
  okrId: string;
};

export default async function LegacyGoalDetailPage(props: {
  params: Params | Promise<Params>;
}) {
  const params = await Promise.resolve(props.params);
  return <OkrDetailPage params={params} />;
}
