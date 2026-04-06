import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";

export function SettingsDetailHeader(props: {
  title: string;
  subtitle?: ReactNode;
  right?: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <PageHeader
      eyebrow={(
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]"
        >
          <Link href="/settings" className="transition hover:text-[color:var(--kw-ink)]">
            Settings
          </Link>
          <ChevronRight size={14} aria-hidden="true" />
          <span className="text-[color:var(--kw-ink)]">{props.title}</span>
        </nav>
      )}
      title={props.title}
      subtitle={props.subtitle}
      right={(
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="secondary" size="sm" className="gap-2">
            <Link href={props.backHref ?? "/settings"}>
              <ChevronLeft size={16} />
              {props.backLabel ?? "Back to settings"}
            </Link>
          </Button>
          {props.right}
        </div>
      )}
    />
  );
}
