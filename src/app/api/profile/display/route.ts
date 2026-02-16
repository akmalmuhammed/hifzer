import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { saveDisplayPrefs } from "@/hifzer/profile/server";

type Payload = {
  darkMode?: unknown;
  themePreset?: unknown;
  accentPreset?: unknown;
};

const ALLOWED_THEME = new Set(["standard", "paper"]);
const ALLOWED_ACCENT = new Set(["teal", "cobalt", "ember"]);

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

  if (!ALLOWED_THEME.has(themePreset)) {
    return NextResponse.json({ error: "Invalid themePreset" }, { status: 400 });
  }
  if (!ALLOWED_ACCENT.has(accentPreset)) {
    return NextResponse.json({ error: "Invalid accentPreset" }, { status: 400 });
  }

  const profile = await saveDisplayPrefs({ clerkUserId: userId, darkMode, themePreset, accentPreset });
  return NextResponse.json({ ok: true, profile });
}

