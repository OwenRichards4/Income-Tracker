"use client";

import { useActionState } from "react";
import { Loader2, Mail } from "lucide-react";
import { inputClass } from "@/lib/form-styles";
import { sendMagicLink, type SendMagicLinkState } from "./actions";

const initialState: SendMagicLinkState = { status: "idle" };

interface LoginFormProps {
  // Where to send the user after they sign in — the page they were trying
  // to reach before being redirected here, if any.
  next?: string | null;
}

export function LoginForm({ next }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(sendMagicLink, initialState);

  if (state.status === "sent") {
    return (
      <div className="mt-8 flex flex-col items-center gap-3 text-center">
        <Mail className="size-8 text-accent" aria-hidden="true" />
        <p className="text-sm text-foreground">Check your email for a sign-in link.</p>
        <p className="text-xs text-muted-foreground">
          It&apos;ll open this app straight to your dashboard — no password needed.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 space-y-5">
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={`${inputClass} mt-1.5`}
          required
        />
        {state.status === "error" && (
          <p className="mt-1 text-xs text-accent">{state.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full cursor-pointer rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span className="inline-flex items-center justify-center gap-2">
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {pending ? "Sending…" : "Send sign-in link"}
        </span>
      </button>
    </form>
  );
}
