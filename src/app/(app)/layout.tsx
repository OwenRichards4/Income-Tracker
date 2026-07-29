import { SiteHeader } from "@/components/site-header";

// Everything that needs the real, auth-aware header lives in this group —
// kept separate from /demo (see src/app/demo/layout.tsx), which gets its
// own header and never touches Supabase auth.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
