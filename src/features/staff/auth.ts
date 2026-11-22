import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../lib/supabase/database.types";

type Client = SupabaseClient<Database>;
export type LoginState = {status: "idle" | "invalid" | "sent" | "error"; message?: string; email?: string};
export type StaffAccess =
  | {status: "signed_out" | "unavailable"}
  | {status: "restricted"; email: string | null}
  | {status: "active"; userId: string; email: string | null; memberships: {
      organizationId: string; role: "companion" | "coordinator"; name: string; timezone: string;
    }[]};

export function applicationOrigin(value: string | undefined): string {
  if (!value) throw new Error("Isi APP_URL dengan origin aplikasi yang tepercaya.");
  const url = new URL(value);
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if ((url.protocol !== "https:" && !(loopback && url.protocol === "http:")) ||
      url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("APP_URL harus berupa origin HTTPS, atau HTTP loopback untuk development.");
  }
  return url.origin;
}

export function confirmationInput(params: URLSearchParams): {type: "email" | "invite"; token_hash: string} | null {
  const type = params.get("type"), token = params.get("token_hash");
  if (params.getAll("type").length !== 1 || params.getAll("token_hash").length !== 1 ||
      (type !== "email" && type !== "invite") || !token || !/^[A-Za-z0-9_-]{20,2048}$/.test(token)) return null;
  return {type, token_hash: token};
}

export async function sendLoginLink(client: Client, value: unknown, origin: string): Promise<LoginState> {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
    return {status: "invalid", message: "Isi alamat email undangan yang valid."};
  }
  try {
    const {error} = await client.auth.signInWithOtp({email, options: {
      shouldCreateUser: false, emailRedirectTo: `${applicationOrigin(origin)}/auth/confirm`,
    }});
    // The conditional response conceals whether an invited account exists.
    if (error && !["otp_disabled", "user_not_found", "signup_disabled"].includes(error.code ?? "")) {
      return {status: "error", message: error.status === 429
        ? "Terlalu banyak permintaan. Tunggu sebentar sebelum mencoba lagi."
        : "Tautan belum dapat diminta. Email tetap tersedia; silakan coba lagi."};
    }
    return {status: "sent", message: "Jika email ini terdaftar, tautan masuk dikirim. Periksa kotak masuk dan folder spam."};
  } catch {
    return {status: "error", message: "Layanan masuk belum tersedia. Email tetap tersedia; silakan coba lagi."};
  }
}

export async function staffAccess(client: Client): Promise<StaffAccess> {
  try {
    const {data, error} = await client.auth.getClaims();
    if (error) return {status: error.status && error.status < 500 && error.status !== 429 ? "signed_out" : "unavailable"};
    const claims = data?.claims;
    if (!claims || typeof claims.sub !== "string" || !claims.sub) return {status: "signed_out"};
    const email = typeof claims.email === "string" ? claims.email : null;
    const result = await client.from("memberships").select("organization_id, role, organizations(name, timezone)")
      .eq("user_id", claims.sub).eq("is_active", true).order("organization_id");
    if (result.error || !result.data || result.data.some(row => !row.organizations)) return {status: "unavailable"};
    if (!result.data.length) return {status: "restricted", email};
    return {status: "active", userId: claims.sub, email, memberships: result.data.map(row => ({
      organizationId: row.organization_id, role: row.role,
      name: row.organizations!.name, timezone: row.organizations!.timezone,
    }))};
  } catch (error) {
    const status = error && typeof error === "object" && "status" in error ? error.status : null;
    return {status: status === 400 || status === 401 || status === 403 ? "signed_out" : "unavailable"};
  }
}
