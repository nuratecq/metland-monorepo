import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE, getPermissionsForUser, permissionFor, satisfies } from "@metland/auth";
import { getDb } from "@/lib/turso";
import { PM_PERM_RULES } from "@/lib/perm-rules";

// Security + rate-limit
const hits = new Map<string, { count: number; reset: number }>();
function rateLimit(req: NextRequest): boolean {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.reset) { hits.set(ip, { count: 1, reset: now + 60000 }); return true; }
  entry.count++; return entry.count <= 60;
}

const PUBLIC_PATHS = new Set(["/", "/login", "/forgot-password"]);

export default async function proxy(req: NextRequest) {
  if (!rateLimit(req)) return new NextResponse("Too Many Requests", { status: 429 });

  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (pathname.startsWith("/api")) {
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Central RBAC. Enforcing here instead of in each route handler keeps the
    // permission map in one auditable place — a new route is guarded by adding
    // a rule, not by remembering to call requirePerm().
    const required = permissionFor(PM_PERM_RULES, pathname, req.method);
    if (required) {
      const perms = await getPermissionsForUser(getDb() as never, session.userId);
      if (!satisfies(perms, required)) {
        return NextResponse.json({ error: `Forbidden: missing permission ${required}` }, { status: 403 });
      }
    }
  } else if (!session && !PUBLIC_PATHS.has(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  } else if (session && (pathname === "/login" || pathname === "/forgot-password")) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  return res;
}

export const config = {
  // Static assets must be excluded by extension too: without this, a request for
  // /logo.png is treated as a page, fails the session check, and is redirected to
  // /login — so the browser receives HTML where it expected an image.
  matcher: ["/((?!_next/static|_next/image|api/auth|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|woff2?|ttf|otf|txt|xml|webmanifest)$).*)"],
};
