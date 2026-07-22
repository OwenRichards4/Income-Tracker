"use server";

import { createClient } from "@/lib/supabase/server";

export interface SendMagicLinkState {
  status: "idle" | "sent" | "error";
  message?: string;
}

export async function sendMagicLink(
  _prevState: SendMagicLinkState,
  formData: FormData,
): Promise<SendMagicLinkState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { status: "error", message: "Enter your email." };
  }

  // Supabase emails a link back to this URL; exchanged for a session in
  // auth/callback/route.ts. Deliberately an explicit env var rather than the
  // request's Origin header — on Vercel that header didn't resolve to the
  // deployed URL the way it does in local dev, silently falling back to
  // whatever Site URL is configured in Supabase instead.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  });

  if (error) {
    return { status: "error", message: error.message };
  }
  return { status: "sent" };
}
