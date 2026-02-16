import type { ReactNode } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export function PlaceholderPage(props: {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon?: ReactNode;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={props.eyebrow} title={props.title} subtitle={props.subtitle} />
      <Card>
        <EmptyState
          title={props.message ?? "Coming soon"}
          message="This route is scaffolded so we can fill it with real product logic next."
          icon={props.icon}
          action={props.action}
        />
      </Card>
    </div>
  );
}

