import { redirect } from "next/navigation";

export const metadata = {
  title: "Hifz",
};

type SessionAliasPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function SessionAliasPage(props: SessionAliasPageProps) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(props.searchParams ?? {})) {
    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
      continue;
    }
    if (typeof value === "string") {
      params.set(key, value);
    }
  }
  const query = params.toString();
  redirect(query ? `/hifz?${query}` : "/hifz");
}
