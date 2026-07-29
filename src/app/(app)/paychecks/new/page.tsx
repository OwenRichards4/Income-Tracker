import Link from "next/link";
import { AddPaycheckForm } from "@/components/add-paycheck-form";

export default function NewPaycheckPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">Add Paycheck</h1>
      <AddPaycheckForm />
    </div>
  );
}
