import { NextResponse } from "next/server";
import { alertAdmin } from "@/lib/admin-alert";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return (forwarded?.split(",")[0] ?? request.headers.get("x-real-ip") ?? "unknown").trim();
}

/** Kizuizi hiki huzuia mtu kutumia ukurasa huu kutuma barua pepe nyingi. */
function throttled(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((at) => now - at < WINDOW_MS);
  recent.push(now);
  if (hits.size > 500) hits.clear();
  hits.set(key, recent);
  return recent.length > MAX_PER_WINDOW;
}

const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return new NextResponse(null, { status: 204 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const where = text(body.where, 60);
  const message = text(body.message, 800);
  if (!where || !message) return new NextResponse(null, { status: 400 });
  if (throttled(clientKey(request))) return new NextResponse(null, { status: 204 });

  await alertAdmin({
    where,
    message,
    page: text(body.page, 300),
    detail: text(body.detail, 800),
  });

  return new NextResponse(null, { status: 204 });
}
