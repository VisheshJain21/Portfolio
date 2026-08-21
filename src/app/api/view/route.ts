import { NextResponse } from "next/server";
import { incrementView } from "@/lib/stats-db";

// Increments unconditionally — the client is responsible for only calling
// this once per tab session (sessionStorage guard in the widget), so a
// page refresh during testing doesn't inflate the count on every reload.
export async function POST() {
  return NextResponse.json(incrementView());
}
