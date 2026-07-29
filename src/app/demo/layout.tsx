import { DemoModeProvider } from "@/lib/demo/context";
import { DemoHeader } from "@/components/demo-header";

// Public, no-signup showcase of the app — every data hook checks
// DemoModeProvider's context and swaps in seeded, in-memory-only data (see
// src/lib/demo) instead of the real Supabase-backed store, and DemoHeader
// replaces the auth-aware SiteHeader used by the (app) route group.
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoModeProvider>
      <DemoHeader />
      {children}
    </DemoModeProvider>
  );
}
