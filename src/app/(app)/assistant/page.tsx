import { PageHeader } from "@/components/app/page-header";
import { QuranAiAssistantPanel } from "@/components/quran/quran-ai-assistant-panel";

export const metadata = {
  title: "AI Assistant",
};

type SearchParamShape = {
  ayahId?: string | string[];
};

function readSingle(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

function parseAyahId(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export default async function AssistantPage(props: { searchParams: Promise<SearchParamShape> }) {
  const searchParams = await props.searchParams;
  const ayahId = parseAyahId(readSingle(searchParams.ayahId));

  return (
    <div className="pb-12 pt-10 md:pb-16 md:pt-14">
      <PageHeader
        eyebrow="Insights"
        title="AI assistant"
        subtitle={
          ayahId
            ? "Ask grounded questions about this ayah or the Qur'an and open matched verses with sources."
            : "Ask grounded Qur'an questions, search by meaning or topic, and open matched ayahs with sources."
        }
      />

      <div className="mt-6 max-w-5xl">
        <QuranAiAssistantPanel ayahId={ayahId} />
      </div>
    </div>
  );
}
