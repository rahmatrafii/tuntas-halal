import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseConfig } from "@/lib/env";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const response = hasSupabaseConfig() ? await updateSession(request) : NextResponse.next();
  if (request.nextUrl.pathname === "/staf" || request.nextUrl.pathname.startsWith("/staf/") || request.nextUrl.pathname.startsWith("/auth/")) {
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
