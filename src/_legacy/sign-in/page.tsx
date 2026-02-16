import { SignInClient } from "./sign-in-client";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function SignInPage(props: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const searchParams = await Promise.resolve(props.searchParams);
  const raw = searchParams?.next;
  const next = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : undefined;
  return <SignInClient nextPath={next ?? "/app"} />;
}
