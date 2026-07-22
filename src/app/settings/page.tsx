import Link from "next/link";
import { cookies } from "next/headers";
import { DEFAULT_THEME, isTheme, THEME_COOKIE } from "@/lib/theme";
import { ThemeToggle } from "@/components/theme-toggle";
import { RolesManager } from "@/components/roles-manager";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(THEME_COOKIE)?.value;
  const theme = isTheme(themeCookie) ? themeCookie : DEFAULT_THEME;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">Settings</h1>

      <section className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-medium">Appearance</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose how Finance Tracker looks on this device.
        </p>
        <div className="mt-4">
          <ThemeToggle initialTheme={theme} />
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-medium">Roles</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Positions you work, each with its own base hourly wage — pick one
          when logging tips.
        </p>
        <div className="mt-4">
          <RolesManager />
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-medium">Account</h2>
        {user?.email && (
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as {user.email}
          </p>
        )}
        <form action={signOut} className="mt-4">
          <button
            type="submit"
            className="cursor-pointer rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
          >
            Sign out
          </button>
        </form>
      </section>
    </div>
  );
}
