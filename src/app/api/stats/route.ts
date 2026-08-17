import { NextResponse } from "next/server";
import { readStats } from "@/lib/stats-db";

// Read-only, no side effects — safe to call on every widget mount.
export async function GET() {
  return NextResponse.json(readStats());
}
