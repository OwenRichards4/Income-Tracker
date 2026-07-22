// text-base (16px), not text-sm — iOS Safari auto-zooms the whole page on
// focus for any input with a computed font-size under 16px. This is the
// actual fix; the common alternative (disabling viewport zoom entirely via
// user-scalable=no) breaks pinch-zoom accessibility and iOS ignores it in
// newer versions anyway.
export const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent";
