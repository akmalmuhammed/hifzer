import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isSupportedReciterId, normalizeReciterId } from "@/hifzer/audio/reciters";
import { saveReciterPrefs } from "@/hifzer/profile/server";

type Payload = {
  reciterId?: unknown;
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
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof payload.reciterId !== "string" || !isSupportedReciterId(payload.reciterId)) {
    return NextResponse.json({ error: "Invalid reciterId." }, { status: 400 });
  }

  const profile = await saveReciterPrefs({
    clerkUserId: userId,
    reciterId: normalizeReciterId(payload.reciterId),
  });

  return NextResponse.json({ ok: true, profile });
}
