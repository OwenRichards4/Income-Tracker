"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useShifts } from "@/lib/use-shifts";
import { AddTipsForm } from "@/components/add-tips-form";

export default function EditShiftPage() {
  const { id } = useParams<{ id: string }>();
  const { shifts, loaded } = useShifts();
  const shift = loaded ? shifts.find((s) => s.id === id) : undefined;

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back
      </Link>

      {!loaded && (
        <div className="mt-8 h-64 animate-pulse rounded-xl border border-border bg-card" />
      )}

      {loaded && !shift && (
        <>
          <h1 className="mt-4 text-2xl font-semibold">Entry not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This entry may have already been deleted.
          </p>
        </>
      )}

      {shift && (
        <>
          <h1 className="mt-4 text-2xl font-semibold">Edit Tips</h1>
          <AddTipsForm initialShift={shift} />
        </>
      )}
    </div>
  );
}
