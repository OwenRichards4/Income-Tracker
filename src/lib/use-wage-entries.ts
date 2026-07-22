"use client";

import { useRemoteList } from "./use-remote-list";
import {
  getWageEntries,
  createWageEntry,
  updateWageEntry as updateWageEntryAction,
  dismissDiscrepancy as dismissDiscrepancyAction,
  deleteWageEntry,
  type WageEntryInput,
} from "@/app/paychecks/actions";
import type { WageEntry } from "./local-data";

const KEY = "wage-entries";

export function useWageEntries() {
  const {
    items: wageEntries,
    loaded,
    add,
    update,
    remove,
    mutate,
  } = useRemoteList<WageEntry, WageEntryInput>(KEY, {
    fetchAll: getWageEntries,
    create: createWageEntry,
    update: updateWageEntryAction,
    remove: deleteWageEntry,
  });

  return {
    wageEntries,
    loaded,
    addWageEntry: (entry: WageEntryInput) => add(entry),
    updateWageEntry: (id: string, input: WageEntryInput) => update(id, input),
    removeWageEntry: remove,
    dismissDiscrepancy: (id: string) => mutate(() => dismissDiscrepancyAction(id)),
  };
}
