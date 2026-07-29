"use client";

import { useRemoteList } from "./use-remote-list";
import {
  getWageEntries,
  createWageEntry,
  updateWageEntry as updateWageEntryAction,
  dismissDiscrepancy as dismissDiscrepancyAction,
  deleteWageEntry,
  type WageEntryInput,
} from "@/app/(app)/paychecks/actions";
import type { WageEntry } from "./local-data";
import { useIsDemoMode } from "./demo/context";
import { demoWageEntryActions } from "./demo/actions";

export function useWageEntries() {
  const isDemo = useIsDemoMode();
  const {
    items: wageEntries,
    loaded,
    add,
    update,
    remove,
    mutate,
  } = useRemoteList<WageEntry, WageEntryInput>(
    isDemo ? "demo-wage-entries" : "wage-entries",
    isDemo
      ? demoWageEntryActions
      : {
          fetchAll: getWageEntries,
          create: createWageEntry,
          update: updateWageEntryAction,
          remove: deleteWageEntry,
        },
  );

  return {
    wageEntries,
    loaded,
    addWageEntry: (entry: WageEntryInput) => add(entry),
    updateWageEntry: (id: string, input: WageEntryInput) => update(id, input),
    removeWageEntry: remove,
    dismissDiscrepancy: (id: string) =>
      mutate(async () => {
        if (!isDemo) return dismissDiscrepancyAction(id);
        const entry = wageEntries.find((e) => e.id === id);
        if (!entry) throw new Error("Paycheck not found");
        return { ...entry, discrepancyDismissed: true };
      }),
  };
}
