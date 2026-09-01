import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Phase 0: passthrough — Phase 0.4 will enforce verifySession on protected routes
export default function proxy(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
