import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");

  const { error } = await searchParams;

  return (
    <div className="mx-auto w-full max-w-sm flex-1 px-6 py-10">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Enter your email and we&apos;ll send you a link — no password to set up.
      </p>
      {error && (
        <p className="mt-3 text-xs text-accent">
          That sign-in link didn&apos;t work — it may have expired. Try again below.
        </p>
      )}
      <LoginForm />
    </div>
  );
}
