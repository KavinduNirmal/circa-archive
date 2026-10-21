import { act, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PersistStorage, StorageValue } from "zustand/middleware";
import { DesktopShell } from "@/components/desktop-shell";
import { DesktopUrlSync } from "@/components/desktop-url-sync";
import type { WorkstationWindowState } from "@/lib/desktop-types";
import {
  createPersistedWorkstationStore,
  type PersistedWorkstationState,
} from "@/stores/workstation-store";
import { catalogFor, renderWorkstation } from "./intl";

/**
 * The persisted workspace and the URL have to agree on a refresh, and the URL
 * has to win. These tests hold the two halves together: the provider rehydrates
 * and validates before the URL adapter runs, so a deep link cannot be erased by
 * a persisted focus, and a restored session cannot steal focus from the address.
 *
 * The navigation module is mocked for the same reason as `desktop-url.test.tsx`:
 * jsdom has no router.
 */
const nav = vi.hoisted(() => ({ pathname: "/desktop" }));
const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => router,
  Link: () => null,
}));

const shell = catalogFor("en").shell;
const ARCHIVE = `${shell.archiveLabel} - ${shell.explorerSuffix}`;
const MAIL = shell.mailTitle;
const RECORD = shell.readerTitle;

const area = { width: 1200, height: 700 };

const windowState = (
  id: string,
  overrides: Partial<WorkstationWindowState> = {},
): WorkstationWindowState => ({
  id,
  title: id,
  status: null,
  icon: { glyph: "archive" },
  geometry: { x: 90, y: 70, width: 640, height: 460 },
  maximized: false,
  minimized: false,
  z: 1,
  ...overrides,
});

function seededStorage(seed: StorageValue<PersistedWorkstationState>) {
  const storage: PersistStorage<PersistedWorkstationState> = {
    getItem: async () => seed,
    setItem: async () => {},
    removeItem: async () => {},
  };
  return storage;
}

/** A storage that withholds the payload until the test releases it. */
function deferredStorage(seed: StorageValue<PersistedWorkstationState>) {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const storage: PersistStorage<PersistedWorkstationState> = {
    getItem: async () => {
      await gate;
      return seed;
    },
    setItem: async () => {},
    removeItem: async () => {},
  };
  return { storage, release };
}

const payload = (
  state: Partial<PersistedWorkstationState>,
): StorageValue<PersistedWorkstationState> => ({
  state: {
    windows: [
      windowState("archive", { title: ARCHIVE, z: 1 }),
      windowState("inbox", { title: MAIL, z: 2 }),
    ],
    lastFocused: "inbox",
    readerTrail: { codes: [], at: 0 },
    screenFilter: true,
    area,
    ...state,
  },
  version: 1,
});

describe("restoring a persisted workspace", () => {
  it("shows an empty desktop until the stored workspace arrives", async () => {
    const { storage, release } = deferredStorage(payload({}));
    const store = createPersistedWorkstationStore({ storage });
    renderWorkstation(<DesktopShell />, { store });

    // skipHydration: the server and the first client render agree on nothing open.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(store.getState().hydrated).toBe(false);

    await act(async () => {
      release();
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(screen.getByRole("dialog", { name: ARCHIVE })).toBeVisible(),
    );
    expect(screen.getByRole("dialog", { name: MAIL })).toBeVisible();
    expect(store.getState().hydrated).toBe(true);
  });

  it("restores every window and focuses the record the URL names", async () => {
    nav.pathname = "/desktop/record/INC-00014";
    const store = createPersistedWorkstationStore({
      storage: seededStorage(payload({})),
    });
    renderWorkstation(
      <>
        <DesktopShell />
        <DesktopUrlSync />
      </>,
      { store },
    );

    const reader = await screen.findByRole("dialog", { name: RECORD });
    expect(within(reader).getByRole("heading", { level: 1 })).toHaveTextContent(
      "Unlogged freight car, northbound",
    );
    // The two persisted windows survive; the URL's resource wins focus.
    expect(
      store
        .getState()
        .windows.map((item) => item.id)
        .sort(),
    ).toEqual(["archive", "inbox", "reader"]);
    expect(store.getState().lastFocused).toBe("reader");
  });

  it("follows the restored focus when the URL is the bare workstation", async () => {
    nav.pathname = "/desktop";
    const store = createPersistedWorkstationStore({
      storage: seededStorage(payload({ lastFocused: "archive" })),
    });
    renderWorkstation(
      <>
        <DesktopShell />
        <DesktopUrlSync />
      </>,
      { store },
    );

    await screen.findByRole("dialog", { name: ARCHIVE });
    // A restored workspace opened at /desktop replaces the address with the
    // focused window, so a refresh lands on what the reader was doing.
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/desktop/archive"),
    );
    expect(store.getState().lastFocused).toBe("archive");
  });
});
