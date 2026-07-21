import Link from "next/link";
import { cookies } from "next/headers";
import { DEFAULT_THEME, isTheme, THEME_COOKIE } from "@/lib/theme";
import { ThemeToggle } from "@/components/theme-toggle";
import { RolesManager } from "@/components/roles-manager";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(THEME_COOKIE)?.value;
  const theme = isTheme(themeCookie) ? themeCookie : DEFAULT_THEME;

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
    </div>
  );
}
