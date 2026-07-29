import { Dashboard } from "@/components/dashboard/dashboard";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <Dashboard />
    </div>
  );
}
