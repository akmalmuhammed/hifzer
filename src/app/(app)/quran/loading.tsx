import { Card } from "@/components/ui/card";

export default function QuranLoading() {
  return (
    <div className="space-y-6 pb-12 pt-10 md:pb-16 md:pt-14">
      <div className="space-y-2">
        <div className="h-4 w-20 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
        <div className="h-8 w-64 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
        <div className="h-4 w-72 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
      </div>

      <Card className="h-64 animate-pulse rounded-[22px] bg-[color:var(--kw-skeleton)]" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <div className="h-5 w-36 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
          <div className="h-4 w-56 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
          <div className="h-10 w-44 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
        </Card>
        <Card className="space-y-3">
          <div className="h-5 w-28 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
          <div className="h-4 w-52 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
          <div className="h-10 w-44 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
        </Card>
      </div>
    </div>
  );
}
