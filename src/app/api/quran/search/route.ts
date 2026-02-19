import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { searchQuranAyahs, type QuranSearchScope } from "@/hifzer/quran/search.server";

export const runtime = "nodejs";

function parseScope(raw: string | null): QuranSearchScope {
  if (raw === "arabic" || raw === "translation") {
    return raw;
  }
  return "all";
}

function parseLimit(raw: string | null): number {
  const value = Math.floor(Number(raw ?? "30"));
  if (!Number.isFinite(value)) {
    return 30;
  }
  return Math.max(1, Math.min(80, value));
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const scope = parseScope(url.searchParams.get("scope"));
  const limit = parseLimit(url.searchParams.get("limit"));

  if (!q) {
    return NextResponse.json({ ok: true, query: q, scope, count: 0, results: [] });
  }

  const results = searchQuranAyahs({ query: q, scope, limit });
  return NextResponse.json({
    ok: true,
    query: q,
    scope,
    count: results.length,
    results,
  });
}
