import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";
import { Card } from "@/components/ui/card";

type DisclosureCardProps = {
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  summaryClassName?: string;
  contentClassName?: string;
};

export function DisclosureCard({
  summary,
  children,
  defaultOpen = false,
  className,
  summaryClassName,
  contentClassName,
}: DisclosureCardProps) {
  return (
    <Card className={className}>
      <details className="group" open={defaultOpen}>
        <summary className={clsx("list-none cursor-pointer", summaryClassName)}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">{summary}</div>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] text-[color:var(--kw-faint)] transition group-open:rotate-180">
              <ChevronDown size={16} />
            </span>
          </div>
        </summary>
        <div className={clsx("mt-4", contentClassName)}>{children}</div>
      </details>
    </Card>
  );
}
