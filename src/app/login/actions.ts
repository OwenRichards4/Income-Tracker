"use server";

import { headers } from "next/headers";
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

  // Carries the page the user was trying to reach through to
  // auth/callback/route.ts, which reads it back off this same query string.
  const next = String(formData.get("next") ?? "");
  const callbackUrl = next ? `/auth/callback?next=${encodeURIComponent(next)}` : "/auth/callback";

  // Supabase emails a link back to this origin; exchanged for a session in
  // auth/callback/route.ts.
  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}${callbackUrl}` },
  });

  if (error) {
    return { status: "error", message: error.message };
  }
  return { status: "sent" };
}
