import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Only allow relative in-app paths — see login/page.tsx's sanitizeNext for
// why this can't just trust the query string as-is.
function sanitizeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

// Landing point for the link Supabase emails from signInWithOtp (login/actions.ts)
// — exchanges the one-time code for a real session cookie, then sends the
// user on to wherever they were trying to go (login/actions.ts sets `next`).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
