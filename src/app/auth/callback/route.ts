import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Landing point for the link Supabase emails from signInWithOtp (login/actions.ts)
// — exchanges the one-time code for a real session cookie, then sends the
// user to the dashboard.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
