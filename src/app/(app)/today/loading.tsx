import { Card } from "@/components/ui/card";
import styles from "./today.module.css";

function PulseLine(props: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)] ${props.className ?? ""}`} />
  );
}

export default function TodayLoading() {
  return (
    <div className={`${styles.page} space-y-6`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <PulseLine className="h-3 w-24" />
          <PulseLine className="mt-3 h-10 w-48" />
          <PulseLine className="mt-3 h-4 w-80 max-w-full" />
        </div>
        <PulseLine className="h-11 w-40" />
      </div>

      <Card className={`${styles.heroCard} relative overflow-hidden`}>
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(var(--kw-accent-rgb),0.18),transparent_68%)] blur-2xl" />
        <div className="relative space-y-5">
          <PulseLine className="h-7 w-56" />
          <PulseLine className="h-4 w-40" />
          <div className="flex flex-wrap items-center gap-2">
            <PulseLine className="h-7 w-28 rounded-full" />
            <PulseLine className="h-7 w-20 rounded-full" />
            <PulseLine className="h-7 w-20 rounded-full" />
            <PulseLine className="h-7 w-16 rounded-full" />
          </div>
          <div className="flex items-center gap-3">
            <PulseLine className="h-10 w-40 rounded-2xl" />
            <PulseLine className="h-10 w-32 rounded-2xl" />
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className={styles.summaryCard}>
            <PulseLine className="h-3 w-16" />
            <PulseLine className="mt-3 h-7 w-32" />
            <PulseLine className="mt-3 h-4 w-full" />
            <PulseLine className="mt-2 h-4 w-3/4" />
            <PulseLine className="mt-5 h-5 w-28" />
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index} className={`${styles.featureCard} h-full`}>
            <PulseLine className="h-3 w-20" />
            <PulseLine className="mt-3 h-8 w-32" />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((__, innerIndex) => (
                <div
                  key={innerIndex}
                  className={`${styles.insetPanel} rounded-[18px] border px-3.5 py-3`}
                >
                  <PulseLine className="h-3 w-20" />
                  <PulseLine className="mt-3 h-4 w-28" />
                  <PulseLine className="mt-2 h-3 w-full" />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
