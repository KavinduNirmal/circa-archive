"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import type { StoreApi } from "zustand/vanilla";
import { createWorkstationStore, type WorkstationStore } from "./workstation-store";

/**
 * One workstation store per mounted workspace.
 *
 * The provider is what gives the store its lifetime: it sits in the workspace
 * layout, so the shell keeps its windows across in-workspace navigation and
 * discards them when the reader leaves for the public archive. The store is
 * created lazily on first render, never at module scope, because a server render
 * must not share one store between requests.
 *
 * A store can be injected for tests, which is what lets a component test assert
 * on the exact state a shell rendered from.
 */
const WorkstationStoreContext = createContext<StoreApi<WorkstationStore> | null>(null);

export function WorkstationStoreProvider({ children, store }: {
  children: ReactNode;
  store?: StoreApi<WorkstationStore>;
}) {
  const [created] = useState(createWorkstationStore);
  return (
    <WorkstationStoreContext.Provider value={store ?? created}>
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
