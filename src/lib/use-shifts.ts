"use client";

import { useRemoteList } from "./use-remote-list";
import {
  getShifts,
  createShift,
  updateShift as updateShiftAction,
  deleteShift,
  type ShiftInput,
} from "@/app/shifts/actions";
import type { Shift } from "./local-data";

const KEY = "shifts";

export function useShifts() {
  const { items: shifts, loaded, add, update, remove } = useRemoteList<Shift, ShiftInput>(KEY, {
    fetchAll: getShifts,
    create: createShift,
    update: updateShiftAction,
    remove: deleteShift,
  });

  return {
    shifts,
    loaded,
    addShift: (shift: ShiftInput) => add(shift),
    updateShift: (id: string, input: ShiftInput) => update(id, input),
    removeShift: remove,
  };
}
