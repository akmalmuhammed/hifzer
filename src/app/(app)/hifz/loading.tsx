import { Card } from "@/components/ui/card";

export default function HifzLoading() {
  return (
    <div className="space-y-6 pb-12 pt-10 md:pb-16 md:pt-14">
      <div className="space-y-2">
        <div className="h-4 w-20 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
        <div className="h-8 w-52 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
        <div className="h-4 w-64 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
      </div>

      <Card className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <div className="h-9 w-28 animate-pulse rounded-full bg-[color:var(--kw-skeleton)]" />
          <div className="h-9 w-28 animate-pulse rounded-full bg-[color:var(--kw-skeleton)]" />
          <div className="h-9 w-28 animate-pulse rounded-full bg-[color:var(--kw-skeleton)]" />
        </div>
        <div className="h-10 w-full animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
        <div className="h-36 w-full animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <div className="h-14 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
          <div className="h-14 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
          <div className="h-14 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
          <div className="h-14 animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)]" />
        </div>
      </Card>
    </div>
  );
}
