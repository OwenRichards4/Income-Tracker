"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  getTaxSettings,
  updateIncomeTaxRate,
  type TaxSettings,
} from "@/app/(app)/settings/tax-actions";
import { useIsDemoMode } from "./demo/context";
import { demoGetTaxSettings, demoUpdateIncomeTaxRate } from "./demo/actions";

type Listener = () => void;

interface Store {
  value: TaxSettings | null;
  loaded: boolean;
  loading: boolean;
  listeners: Set<Listener>;
}

// One store per key ("real" vs "demo"), not a single shared instance —
// there's only ever one tax-settings record per signed-in user (so this
// doesn't reuse use-remote-list.ts's list-shaped engine), but /demo still
// needs its own copy kept separate from the real one, the same reason
// use-remote-list.ts's stores are keyed by name.
const stores = new Map<string, Store>();

function getStore(key: string): Store {
  let store = stores.get(key);
  if (!store) {
    store = { value: null, loaded: false, loading: false, listeners: new Set() };
    stores.set(key, store);
  }
  return store;
}

function notify(store: Store) {
  store.listeners.forEach((listener) => listener());
}

export function useTaxSettings() {
  const isDemo = useIsDemoMode();
  const key = isDemo ? "demo" : "real";
  const fetchSettings = isDemo ? demoGetTaxSettings : getTaxSettings;
  const updateRate = isDemo ? demoUpdateIncomeTaxRate : updateIncomeTaxRate;

  useEffect(() => {
    const store = getStore(key);
    if (store.loaded || store.loading) return;
    store.loading = true;
    fetchSettings().then(
      (value) => {
        store.value = value;
        store.loaded = true;
        store.loading = false;
        notify(store);
      },
      (error) => {
        console.error("Failed to load tax settings:", error);
        store.loaded = true;
        store.loading = false;
        notify(store);
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const subscribe = useCallback(
    (onStoreChange: Listener) => {
      const store = getStore(key);
      store.listeners.add(onStoreChange);
      return () => store.listeners.delete(onStoreChange);
    },
    [key],
  );

  const taxSettings = useSyncExternalStore(
    subscribe,
    () => getStore(key).value,
    () => null,
  );
  const loaded = useSyncExternalStore(
    subscribe,
    () => getStore(key).loaded,
    () => false,
  );

  const setIncomeTaxRate = useCallback(
    async (rate: number) => {
      const updated = await updateRate(rate);
      const store = getStore(key);
      store.value = updated;
      notify(store);
      return updated;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  return { taxSettings, loaded, setIncomeTaxRate };
}
