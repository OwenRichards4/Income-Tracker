"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useWageEntries } from "@/lib/use-wage-entries";
import { AddPaycheckForm } from "@/components/add-paycheck-form";

export default function EditPaycheckPage() {
  const { id } = useParams<{ id: string }>();
  const { wageEntries, loaded } = useWageEntries();
  const entry = loaded ? wageEntries.find((e) => e.id === id) : undefined;

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

      {loaded && !entry && (
        <>
          <h1 className="mt-4 text-2xl font-semibold">Entry not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This entry may have already been deleted.
          </p>
        </>
      )}

      {entry && (
        <>
          <h1 className="mt-4 text-2xl font-semibold">Edit Paycheck</h1>
          <AddPaycheckForm initialEntry={entry} />
        </>
      )}
    </div>
  );
}
