import { NextResponse } from "next/server";
import { setLike } from "@/lib/stats-db";

// Body: { liked: boolean } — the NEW state the client wants (it already
// knows its own prior state from localStorage). true → +1, false → -1.
// Client-authoritative-intent + server-side aggregate: no auth/cookies/IP
// tracking needed. Toggle semantics mean abuse is naturally capped at ±1
// per browser — no extra rate-limiting required.
export async function POST(req: Request) {
  let liked: unknown;
  try {
    ({ liked } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof liked !== "boolean") {
    return NextResponse.json({ error: "'liked' must be a boolean" }, { status: 400 });
  }
  return NextResponse.json(setLike(liked));
}
