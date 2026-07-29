"use client";

import { useRemoteList } from "./use-remote-list";
import {
  getShifts,
  createShift,
  updateShift as updateShiftAction,
  deleteShift,
  type ShiftInput,
} from "@/app/(app)/shifts/actions";
import type { Shift } from "./local-data";
import { useIsDemoMode } from "./demo/context";
import { demoShiftActions } from "./demo/actions";

export function useShifts() {
  const isDemo = useIsDemoMode();
  const { items: shifts, loaded, add, update, remove } = useRemoteList<Shift, ShiftInput>(
    isDemo ? "demo-shifts" : "shifts",
    isDemo
      ? demoShiftActions
      : {
          fetchAll: getShifts,
          create: createShift,
          update: updateShiftAction,
          remove: deleteShift,
        },
  );

  return {
    shifts,
    loaded,
    addShift: (shift: ShiftInput) => add(shift),
    updateShift: (id: string, input: ShiftInput) => update(id, input),
    removeShift: remove,
  };
}
