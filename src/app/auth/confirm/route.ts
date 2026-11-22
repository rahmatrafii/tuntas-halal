import {NextResponse, type NextRequest} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {applicationOrigin, confirmationInput} from "@/features/staff/auth";

export async function GET(request: NextRequest) {
  let origin: string;
  const headers = {"Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer"};
  try {origin = applicationOrigin(process.env.APP_URL);} catch {
    return new NextResponse("Layanan konfirmasi belum dikonfigurasi.", {status: 503, headers});
  }
  const input = confirmationInput(request.nextUrl.searchParams);
  let success = false;
  if (input) {
    try {success = !(await (await createClient()).auth.verifyOtp(input)).error;} catch { /* Invalid/provider failures return a safe login message. */ }
  }
  const response = NextResponse.redirect(new URL(success ? "/staf" : "/staf/login?error=tautan", origin), 303);
  for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
  return response;
}
