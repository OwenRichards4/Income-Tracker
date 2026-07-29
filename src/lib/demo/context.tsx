"use client";

import { createContext, useContext } from "react";

const DemoModeContext = createContext(false);

// Wraps the /demo route tree (see src/app/demo/layout.tsx) so every data
// hook and every internal link under it can tell it's in demo mode without
// prop-drilling — the data hooks use this to swap in the in-memory demo
// store instead of the real Supabase-backed one, and links use it to stay
// under /demo instead of bouncing out to the real (auth-gated) routes.
export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  return <DemoModeContext.Provider value={true}>{children}</DemoModeContext.Provider>;
}

export function useIsDemoMode(): boolean {
  return useContext(DemoModeContext);
}

// Every internal navigation in the shared components (add-tips-form,
// payroll-warning, the recent-entries tables, ...) is written against the
// real app's routes — this is the one place that decides whether to keep
// it there or redirect it under /demo, so no component has to special-case
// itself.
export function useHomeHref(): string {
  return useIsDemoMode() ? "/demo" : "/";
}
