import "server-only";
import { revalidateTag } from "next/cache";

const DASHBOARD_AREAS = ["overview", "summary", "details", "streak", "quran", "activity"] as const;

export function dashboardCacheTag(area: (typeof DASHBOARD_AREAS)[number], clerkUserId: string) {
  return `dashboard-${area}:${clerkUserId}`;
}

export function dashboardCacheTags(clerkUserId: string) {
  return DASHBOARD_AREAS.map((area) => dashboardCacheTag(area, clerkUserId));
}

export function invalidateDashboardCaches(clerkUserId: string) {
  for (const tag of dashboardCacheTags(clerkUserId)) {
    revalidateTag(tag, { expire: 0 });
  }
}
