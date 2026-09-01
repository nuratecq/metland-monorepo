import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Security + rate-limit docs/PRD.md:1266
const hits = new Map<string, { count: number; reset: number }>();
function rateLimit(req: NextRequest): boolean {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.reset) { hits.set(ip, { count: 1, reset: now + 60000 }); return true; }
  entry.count++; return entry.count <= 60;
}

export default function proxy(req: NextRequest) {
  if (!rateLimit(req)) return new NextResponse("Too Many Requests", { status: 429 });
  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
