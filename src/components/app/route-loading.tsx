import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

function SkeletonBlock(props: { className: string }) {
  return <div className={`animate-pulse rounded-[18px] bg-[color:var(--kw-skeleton)] ${props.className}`} />;
}

function LoadingHeader(props: {
  eyebrowWidth?: string;
  titleWidth?: string;
  subtitleWidth?: string;
}) {
  return (
    <div className="space-y-2">
      <SkeletonBlock className={props.eyebrowWidth ?? "h-4 w-20"} />
      <SkeletonBlock className={props.titleWidth ?? "h-8 w-64"} />
      <SkeletonBlock className={props.subtitleWidth ?? "h-4 w-80"} />
    </div>
  );
}

function LoadingShell(props: { children: ReactNode }) {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-6 pb-12 pt-10 md:pb-16 md:pt-14">
      {props.children}
    </div>
  );
}

export function GenericAppRouteLoading() {
  return (
    <LoadingShell>
      <LoadingHeader subtitleWidth="h-4 w-72" />

      <Card className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <SkeletonBlock className="h-8 w-24 rounded-full" />
          <SkeletonBlock className="h-8 w-28 rounded-full" />
        </div>
        <SkeletonBlock className="h-12 w-full" />
        <SkeletonBlock className="h-28 w-full rounded-[22px]" />
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="space-y-3">
          <SkeletonBlock className="h-6 w-24 rounded-full" />
          <SkeletonBlock className="h-9 w-20" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-5/6" />
        </Card>
        <Card className="space-y-3">
          <SkeletonBlock className="h-6 w-28 rounded-full" />
          <SkeletonBlock className="h-9 w-16" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-4/5" />
        </Card>
        <Card className="space-y-3">
          <SkeletonBlock className="h-6 w-24 rounded-full" />
          <SkeletonBlock className="h-9 w-14" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-4/5" />
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="space-y-3">
          <SkeletonBlock className="h-5 w-36" />
          <SkeletonBlock className="h-4 w-5/6" />
          <SkeletonBlock className="h-4 w-2/3" />
          <SkeletonBlock className="h-24 w-full rounded-[22px]" />
        </Card>
        <Card className="space-y-3">
          <SkeletonBlock className="h-5 w-32" />
          <SkeletonBlock className="h-4 w-3/4" />
          <SkeletonBlock className="h-4 w-2/3" />
          <SkeletonBlock className="h-24 w-full rounded-[22px]" />
        </Card>
      </div>
    </LoadingShell>
  );
}

export function DashboardRouteLoading() {
  return (
    <LoadingShell>
      <LoadingHeader titleWidth="h-8 w-56" subtitleWidth="h-4 w-80" />

      <Card className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <SkeletonBlock className="h-8 w-28 rounded-full" />
          <SkeletonBlock className="h-8 w-32 rounded-full" />
          <SkeletonBlock className="h-8 w-24 rounded-full" />
        </div>
        <SkeletonBlock className="h-16 w-full rounded-[22px]" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SkeletonBlock className="h-24 w-full rounded-[22px]" />
          <SkeletonBlock className="h-24 w-full rounded-[22px]" />
          <SkeletonBlock className="h-24 w-full rounded-[22px]" />
          <SkeletonBlock className="h-24 w-full rounded-[22px]" />
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card className="space-y-3">
          <SkeletonBlock className="h-5 w-36" />
          <SkeletonBlock className="h-4 w-5/6" />
          <SkeletonBlock className="h-36 w-full rounded-[22px]" />
        </Card>
        <Card className="space-y-3">
          <SkeletonBlock className="h-5 w-28" />
          <SkeletonBlock className="h-4 w-2/3" />
          <SkeletonBlock className="h-14 w-full rounded-[18px]" />
          <SkeletonBlock className="h-14 w-full rounded-[18px]" />
          <SkeletonBlock className="h-14 w-full rounded-[18px]" />
        </Card>
      </div>
    </LoadingShell>
  );
}

export function DuaRouteLoading() {
  return (
    <LoadingShell>
      <LoadingHeader titleWidth="h-8 w-44" subtitleWidth="h-4 w-96" />

      <Card className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <SkeletonBlock className="h-9 w-24 rounded-full" />
          <SkeletonBlock className="h-9 w-28 rounded-full" />
          <SkeletonBlock className="h-9 w-24 rounded-full" />
        </div>
        <SkeletonBlock className="h-32 w-full rounded-[22px]" />
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="space-y-3">
          <SkeletonBlock className="h-5 w-24" />
          <SkeletonBlock className="h-4 w-5/6" />
          <SkeletonBlock className="h-4 w-2/3" />
          <SkeletonBlock className="h-10 w-32" />
        </Card>
        <Card className="space-y-3">
          <SkeletonBlock className="h-5 w-28" />
          <SkeletonBlock className="h-4 w-4/5" />
          <SkeletonBlock className="h-4 w-3/4" />
          <SkeletonBlock className="h-10 w-32" />
        </Card>
        <Card className="space-y-3">
          <SkeletonBlock className="h-5 w-20" />
          <SkeletonBlock className="h-4 w-5/6" />
          <SkeletonBlock className="h-4 w-2/3" />
          <SkeletonBlock className="h-10 w-32" />
        </Card>
      </div>
    </LoadingShell>
  );
}

export function JournalRouteLoading() {
  return (
    <LoadingShell>
      <LoadingHeader titleWidth="h-8 w-60" subtitleWidth="h-4 w-80" />

      <Card className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <SkeletonBlock className="h-8 w-24 rounded-full" />
          <SkeletonBlock className="h-8 w-28 rounded-full" />
        </div>
        <SkeletonBlock className="h-12 w-full" />
        <SkeletonBlock className="h-36 w-full rounded-[22px]" />
        <div className="flex flex-wrap gap-2">
          <SkeletonBlock className="h-10 w-28" />
          <SkeletonBlock className="h-10 w-32" />
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="space-y-3">
          <SkeletonBlock className="h-5 w-36" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-11/12" />
          <SkeletonBlock className="h-4 w-3/4" />
        </Card>
        <Card className="space-y-3">
          <SkeletonBlock className="h-5 w-28" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-5/6" />
          <SkeletonBlock className="h-4 w-2/3" />
        </Card>
      </div>
    </LoadingShell>
  );
}

export function SettingsRouteLoading() {
  return (
    <LoadingShell>
      <LoadingHeader titleWidth="h-8 w-40" subtitleWidth="h-4 w-80" />

      <Card className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <SkeletonBlock className="h-8 w-28 rounded-full" />
          <SkeletonBlock className="h-8 w-24 rounded-full" />
        </div>
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-5/6" />
      </Card>

      <div className="flex gap-2 overflow-hidden">
        <SkeletonBlock className="h-24 min-w-[190px] flex-1 rounded-[20px]" />
        <SkeletonBlock className="h-24 min-w-[190px] flex-1 rounded-[20px]" />
        <SkeletonBlock className="h-24 min-w-[190px] flex-1 rounded-[20px]" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="space-y-3">
          <SkeletonBlock className="h-6 w-20 rounded-full" />
          <SkeletonBlock className="h-5 w-32" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-4/5" />
        </Card>
        <Card className="space-y-3">
          <SkeletonBlock className="h-6 w-24 rounded-full" />
          <SkeletonBlock className="h-5 w-36" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-5/6" />
        </Card>
        <Card className="space-y-3">
          <SkeletonBlock className="h-6 w-24 rounded-full" />
          <SkeletonBlock className="h-5 w-28" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-2/3" />
        </Card>
      </div>
    </LoadingShell>
  );
}
