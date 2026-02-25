import { cookies } from "next/headers";
import { DISTRACTION_FREE_COOKIE, normalizeDistractionFree } from "@/hifzer/focus/distraction-free";

export async function getDistractionFreeServer(): Promise<boolean> {
  const cookieStore = await cookies();
  return normalizeDistractionFree(cookieStore.get(DISTRACTION_FREE_COOKIE)?.value);
}
