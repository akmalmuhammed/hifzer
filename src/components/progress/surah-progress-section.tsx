import Link from "next/link";
import { ArrowRight, BookOpenText, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import type { SurahProgressItem } from "@/hifzer/progress/surah-progress.server";

type Props = {
  title: string;
  subtitle: string;
  items: SurahProgressItem[];
  viewAllHref?: string;
  emptyTitle?: string;
  emptyBody?: string;
  defaultExpanded?: boolean;
};

function formatTouchedAt(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ProgressRow({ item }: { item: SurahProgressItem }) {
  const touchedAt = formatTouchedAt(item.lastTouchedAt);
  const completionBadge = item.isCompleted
    ? `${item.completionCount}x`
    : `${item.completionPct}%`;

  return (
    <div
      className={`rounded-[18px] p-4 transition-colors sm:p-5 ${
        item.isCompleted
          ? "bg-[color:var(--kw-pill-success-bg)]"
          : item.isCurrent
            ? "bg-[rgba(var(--kw-accent-rgb),0.08)]"
            : "bg-[color:var(--kw-fill)]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[1.06rem] font-semibold tracking-[-0.02em] text-[color:var(--kw-ink)]">
            {item.surahName}
          </p>
          <p className="mt-1 text-[0.82rem] tabular-nums text-[color:var(--kw-faint)]">
            Surah {item.surahNumber} - {item.completedAyahCount}/{item.ayahCount} ayahs
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {item.isCurrent ? <Pill tone="accent">Current</Pill> : null}
          {item.isCompleted ? <Pill tone="accent">Completed</Pill> : null}
          <span
            className={`inline-flex items-center rounded-full bg-[color:var(--kw-card)] px-2.5 py-1 text-xs font-semibold tabular-nums ${
              item.isCompleted
                ? "text-[color:var(--kw-pill-success-fg)]"
                : "text-[color:var(--kw-muted)]"
            }`}
          >
            {completionBadge}
          </span>
        </div>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[color:var(--kw-track)]">
        <div
          className={`h-full rounded-full transition-[width] ${
            item.isCompleted ? "bg-[color:var(--kw-lime-600)]" : "bg-[rgba(var(--kw-accent-rgb),1)]"
          }`}
          style={{ width: `${item.completionPct}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm tabular-nums">
        <span className="text-[color:var(--kw-muted)]">
          {item.isCompleted
            ? `Completed ${item.completionCount} time${item.completionCount === 1 ? "" : "s"}`
            : `${item.completionPct}% complete`}
        </span>
        {touchedAt ? (
          <span className="text-[color:var(--kw-faint)]">Last touched {touchedAt}</span>
        ) : null}
      </div>
    </div>
  );
}

export function SurahProgressSection({
  title,
  subtitle,
  items,
  viewAllHref,
  emptyTitle = "No surah progress yet",
  emptyBody = "Keep going and your surahs will appear here.",
  defaultExpanded = false,
}: Props) {
  const inProgress = items.filter((item) => item.isCurrent || !item.isCompleted);
  const completed = items.filter((item) => item.isCompleted && !item.isCurrent);

  return (
    <Card>
      <details className="group" open={defaultExpanded}>
        <summary className="list-none cursor-pointer">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <BookOpenText size={16} className="text-[color:var(--kw-faint)]" />
                <p className="text-[1.12rem] font-semibold tracking-[-0.02em] text-[color:var(--kw-ink)]">{title}</p>
              </div>
              <p className="mt-2 max-w-3xl text-[0.94rem] leading-[1.5] text-[color:var(--kw-muted)]">{subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <Pill tone="neutral">{items.length} surahs</Pill>
              <span className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[color:var(--kw-fill-strong)] px-3.5 py-2 text-sm font-medium text-[color:var(--kw-ink)]">
                <span className="group-open:hidden">Show</span>
                <span className="hidden group-open:inline">Hide</span>
                <ChevronDown size={15} className="transition-transform group-open:rotate-180" />
              </span>
            </div>
          </div>
        </summary>

        <div className="mt-6">
          {viewAllHref ? (
            <div className="mb-4 flex justify-start">
              <Link
                href={viewAllHref}
                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[rgba(var(--kw-accent-rgb),0.1)] px-4 py-2 text-sm font-medium text-[rgba(var(--kw-accent-rgb),1)] transition-colors duration-200 hover:bg-[rgba(var(--kw-accent-rgb),0.16)]"
              >
                See all surahs <ArrowRight size={15} />
              </Link>
            </div>
          ) : null}

          {items.length < 1 ? (
            <div className="rounded-[18px] bg-[color:var(--kw-fill)] p-5">
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{emptyTitle}</p>
              <p className="mt-1 text-sm leading-6 text-[color:var(--kw-muted)]">{emptyBody}</p>
            </div>
          ) : (
            <>
              {inProgress.length > 0 ? (
                <div>
                  <div className="flex items-center gap-2">
                    <Pill tone="neutral">In progress</Pill>
                    <span className="text-[0.82rem] font-medium text-[color:var(--kw-faint)]">
                      Where you are now
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3 xl:grid-cols-2">
                    {inProgress.map((item) => (
                      <ProgressRow key={`${item.lane}-${item.surahNumber}`} item={item} />
                    ))}
                  </div>
                </div>
              ) : null}

              {completed.length > 0 ? (
                <div className="mt-6">
                  <div className="flex items-center gap-2">
                    <Pill tone="accent">Completed</Pill>
                    <span className="text-[0.82rem] font-medium text-[color:var(--kw-faint)]">
                      Finished surahs
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3 xl:grid-cols-2">
                    {completed.map((item) => (
                      <ProgressRow key={`${item.lane}-${item.surahNumber}`} item={item} />
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </details>
    </Card>
  );
}
