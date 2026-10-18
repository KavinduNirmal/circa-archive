"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import { createPersistedWorkstationStore, type WorkstationStore, type WorkstationStoreApi } from "./workstation-store";

/**
 * One workstation store per mounted workspace.
 *
 * The provider is what gives the store its lifetime: it sits in the workspace
 * layout, so the shell keeps its windows across in-workspace navigation and
 * discards them when the reader leaves for the public archive. The store is
 * created lazily on first render, never at module scope, because a server render
 * must not share one store between requests.
 *
 * A store can be injected, which is what lets a test render the shell over a
 * known workspace: the shell tests inject a plain store, the persistence tests a
 * store backed by storage they control.
 */
const WorkstationStoreContext = createContext<WorkstationStoreApi | null>(null);

export function WorkstationStoreProvider({ children, store }: {
  children: ReactNode;
  store?: WorkstationStoreApi;
}) {
  const [created] = useState<WorkstationStoreApi>(() => store ?? createPersistedWorkstationStore());

  /*
   * Rehydration happens after mount, never during render, and validation is the
   * last step before `hydrated` turns true. Both matter: a stored workspace is
   * untrusted input, and the URL adapter waits for this flag before it adopts an
   * address into the desktop.
   */
  useEffect(() => {
    const persistApi = created.persist;
    // A store without persistence is already hydrated; nothing to restore.
    if (!persistApi) return;
    let cancelled = false;
    const finish = () => {
      if (!cancelled) created.getState().validateRestored();
    };
    if (persistApi.hasHydrated()) {
      finish();
      return () => { cancelled = true; };
    }
    const unsubscribe = persistApi.onFinishHydration(finish);
    void persistApi.rehydrate();
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [created]);

  return (
    <WorkstationStoreContext.Provider value={created}>
      {children}
    </WorkstationStoreContext.Provider>
  );
}

/** Select one slice of workstation state. The selector must be stable enough not to re-render on every action. */
export function useWorkstationStore<T>(selector: (state: WorkstationStore) => T): T {
  const store = useContext(WorkstationStoreContext);
  if (!store) {
    throw new Error("useWorkstationStore must be used inside a WorkstationStoreProvider");
  }
  return useStore(store, selector);
}
