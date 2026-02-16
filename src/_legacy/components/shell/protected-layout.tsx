"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { useDemoAuth } from "@/demo/demo-auth";

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useDemoAuth();

  useEffect(() => {
    if (status === "signed_in") {
      return;
    }
    const next = encodeURIComponent(pathname || "/app");
    router.replace(`/sign-in?next=${next}`);
  }, [pathname, router, status]);

  if (status !== "signed_in") {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-[1200px] place-items-center px-4 py-10">
        <div className="w-full max-w-lg space-y-3">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}

