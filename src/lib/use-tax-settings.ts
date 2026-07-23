"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  getTaxSettings,
  updateIncomeTaxRate,
  type TaxSettings,
} from "@/app/settings/tax-actions";

type Listener = () => void;

// A single shared instance, not a list keyed by id — there's only ever one
// tax-settings record per signed-in user, so this doesn't reuse
// use-remote-list.ts's list-shaped engine.
const store: { value: TaxSettings | null; loaded: boolean; loading: boolean; listeners: Set<Listener> } = {
  value: null,
  loaded: false,
  loading: false,
  listeners: new Set(),
};

function notify() {
  store.listeners.forEach((listener) => listener());
}

export function useTaxSettings() {
  useEffect(() => {
    if (store.loaded || store.loading) return;
    store.loading = true;
    getTaxSettings().then(
      (value) => {
        store.value = value;
        store.loaded = true;
        store.loading = false;
        notify();
      },
      (error) => {
        console.error("Failed to load tax settings:", error);
        store.loaded = true;
        store.loading = false;
        notify();
      },
    );
  }, []);

  const subscribe = useCallback((onStoreChange: Listener) => {
    store.listeners.add(onStoreChange);
    return () => store.listeners.delete(onStoreChange);
  }, []);

  const taxSettings = useSyncExternalStore(
    subscribe,
    () => store.value,
    () => null,
  );
  const loaded = useSyncExternalStore(
    subscribe,
    () => store.loaded,
    () => false,
  );

  const setIncomeTaxRate = useCallback(async (rate: number) => {
    const updated = await updateIncomeTaxRate(rate);
    store.value = updated;
    notify();
    return updated;
  }, []);

  return { taxSettings, loaded, setIncomeTaxRate };
}
