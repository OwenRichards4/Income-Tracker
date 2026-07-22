"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

type Listener = () => void;

interface Store<T> {
  items: T[];
  loaded: boolean;
  loading: boolean;
  listeners: Set<Listener>;
}

// One store per key, shared by every component that reads it — otherwise
// each hook call held its own private state, so writing a paycheck in one
// component (e.g. the add form) would never show up in another (e.g. the
// header's payroll warning) without a full reload. See use-local-storage-
// list.ts's git history for the version of this problem that hit
// localStorage before the app talked to a real backend.
const stores = new Map<string, Store<unknown>>();

function getStore<T>(key: string): Store<T> {
  let store = stores.get(key) as Store<T> | undefined;
  if (!store) {
    store = { items: [], loaded: false, loading: false, listeners: new Set() };
    stores.set(key, store as Store<unknown>);
  }
  return store;
}

function notify<T>(store: Store<T>) {
  store.listeners.forEach((listener) => listener());
}

const EMPTY: never[] = [];

export interface RemoteListActions<T extends { id: string }, Input> {
  fetchAll: () => Promise<T[]>;
  create: (input: Input) => Promise<T>;
  update?: (id: string, input: Input) => Promise<T>;
  remove: (id: string) => Promise<void>;
}

// Client-side shared store fronting server-persisted data — `actions` are
// Server Actions (Postgres via Supabase). Mutations update the shared store
// from the server's returned row once the write actually succeeds, rather
// than eagerly/optimistically, so a failed write can't leave the UI showing
// something that was never saved.
export function useRemoteList<T extends { id: string }, Input>(
  key: string,
  actions: RemoteListActions<T, Input>,
) {
  useEffect(() => {
    const store = getStore<T>(key);
    if (store.loaded || store.loading) return;
    store.loading = true;
    actions.fetchAll().then(
      (items) => {
        store.items = items;
        store.loaded = true;
        store.loading = false;
        notify(store);
      },
      (error) => {
        console.error(`Failed to load "${key}":`, error);
        store.loaded = true;
        store.loading = false;
        notify(store);
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const subscribe = useCallback(
    (onStoreChange: Listener) => {
      const store = getStore<T>(key);
      store.listeners.add(onStoreChange);
      return () => store.listeners.delete(onStoreChange);
    },
    [key],
  );

  const items = useSyncExternalStore(
    subscribe,
    () => getStore<T>(key).items,
    () => EMPTY as T[],
  );
  const loaded = useSyncExternalStore(
    subscribe,
    () => getStore<T>(key).loaded,
    () => false,
  );

  const add = useCallback(
    async (input: Input) => {
      const created = await actions.create(input);
      const store = getStore<T>(key);
      store.items = [...store.items, created];
      notify(store);
      return created;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  const update = useCallback(
    async (id: string, input: Input) => {
      if (!actions.update) throw new Error(`"${key}" does not support update`);
      const updated = await actions.update(id, input);
      const store = getStore<T>(key);
      store.items = store.items.map((item) => (item.id === id ? updated : item));
      notify(store);
      return updated;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  // Escape hatch for one-off mutations that don't fit the create/update/
  // remove shape (e.g. dismissing a payroll warning) — runs `fn`, then
  // patches its returned row into the shared store the same way `update`
  // does, so every subscribed component reflects it immediately.
  const mutate = useCallback(
    async (fn: () => Promise<T>) => {
      const updated = await fn();
      const store = getStore<T>(key);
      store.items = store.items.map((item) => (item.id === updated.id ? updated : item));
      notify(store);
      return updated;
    },
    [key],
  );

  const remove = useCallback(
    async (id: string) => {
      await actions.remove(id);
      const store = getStore<T>(key);
      store.items = store.items.filter((item) => item.id !== id);
      notify(store);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  return { items, loaded, add, update, remove, mutate };
}
