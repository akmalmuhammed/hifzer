import ProjectDetailPage from "@/_legacy/kw-app-routes/projects/[projectId]/page";

type Params = {
  projectId: string;
};

export default async function LegacyProjectDetailPage(props: {
  params: Params | Promise<Params>;
}) {
  const params = await Promise.resolve(props.params);
  return <ProjectDetailPage params={params} />;
}
