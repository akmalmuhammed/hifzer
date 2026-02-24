import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { saveQuranReaderPrefs } from "@/hifzer/profile/server";

type Payload = {
  quranShowDetails?: unknown;
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

  if (typeof payload.quranShowDetails !== "boolean") {
    return NextResponse.json({ error: "quranShowDetails must be boolean." }, { status: 400 });
  }

  const profile = await saveQuranReaderPrefs({
    clerkUserId: userId,
    quranShowDetails: payload.quranShowDetails,
  });

  return NextResponse.json({ ok: true, profile });
}
