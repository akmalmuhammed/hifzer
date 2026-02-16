import { BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/app/page-header";

export const metadata = {
  title: "Fluency Lesson",
};

export default async function FluencyLessonPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fluency"
        title={`Lesson ${params.id}`}
        subtitle="Individual fluency lesson (placeholder)."
      />
      <Card>
        <EmptyState
          title="Lesson not wired yet"
          message="This will host guided recitation drills and retest prep."
          icon={<BookOpen size={18} />}
        />
      </Card>
    </div>
  );
}

