import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { saveDisplayPrefs } from "@/hifzer/profile/server";
import {
  buildThemeAccentCookieValue,
  buildThemeModeCookieValue,
  buildThemePresetCookieValue,
  isAccentPreset,
  isThemePreset,
} from "@/hifzer/theme/preferences";

type Payload = {
  darkMode?: unknown;
  themePreset?: unknown;
  accentPreset?: unknown;
};

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const darkMode = Boolean(payload.darkMode);
  const themePreset = String(payload.themePreset ?? "standard");
  const accentPreset = String(payload.accentPreset ?? "teal");

  if (!isThemePreset(themePreset)) {
    return NextResponse.json({ error: "Invalid themePreset" }, { status: 400 });
  }
  if (!isAccentPreset(accentPreset)) {
    return NextResponse.json({ error: "Invalid accentPreset" }, { status: 400 });
  }

  const profile = await saveDisplayPrefs({ clerkUserId: userId, darkMode, themePreset, accentPreset });
  const response = NextResponse.json({ ok: true, profile });
  response.headers.append("Set-Cookie", buildThemeModeCookieValue(darkMode ? "dark" : "light"));
  response.headers.append("Set-Cookie", buildThemePresetCookieValue(themePreset));
  response.headers.append("Set-Cookie", buildThemeAccentCookieValue(accentPreset));
  return response;
}
