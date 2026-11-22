import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/env";
import type { Database } from "./database.types";
import { applicationOrigin } from "@/features/staff/auth";

export async function updateSession(request: NextRequest) {
  const { url, key } = getSupabaseConfig();
  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, cacheHeaders) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(cacheHeaders).forEach(([name, value]) =>
          response.headers.set(name, value),
        );
      },
    },
  });
  let hasIdentity = false;
  let unavailable = false;
  try {
    const {data, error} = await supabase.auth.getClaims();
    hasIdentity = Boolean(data?.claims.sub);
    unavailable = Boolean(error && (!error.status || error.status >= 500 || error.status === 429));
  } catch (error) {
    const status = error && typeof error === "object" && "status" in error ? error.status : null;
    unavailable = status !== 400 && status !== 401 && status !== 403;
  }
  const path = request.nextUrl.pathname;
  if ((path === "/staf" || path.startsWith("/staf/")) && path !== "/staf/login" && !hasIdentity && !unavailable) {
    // Redirect before the loading boundary streams; retain refresh/deletion cookies.
    let origin: string;
    try {origin = applicationOrigin(process.env.APP_URL);} catch {
      return new NextResponse("Layanan staf belum dikonfigurasi.", {status: 503});
    }
    const redirect = NextResponse.redirect(new URL("/staf/login", origin));
    response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
    for (const name of ["cache-control", "expires", "pragma"]) {
      const value = response.headers.get(name);
      if (value) redirect.headers.set(name, value);
    }
    return redirect;
  }
  return response;
}
