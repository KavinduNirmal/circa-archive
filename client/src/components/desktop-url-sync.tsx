"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  focusedResource,
  pathForResource,
  resourceFromPath,
  resourceKey,
} from "@/lib/desktop-route";
import { specForDestination } from "@/lib/desktop-windows";
import { useWorkstationStore } from "@/stores/workstation-store-provider";

/**
 * The workstation's one routing surface.
 *
 * It renders nothing and is the only component in the workspace that reads or
 * writes the pathname, which is what lets the shell and its tests stay free of
 * routing. The scheme is `/{lang}/desktop`, `/{lang}/desktop/{destination}`, and
 * `/{lang}/desktop/record/{code}`; `src/lib/desktop-route.ts` owns the mapping.
 *
 * The history policy, in one place:
 *
 * - A newly opened document is a history entry → `push`.
 * - Focus, minimize, close, and a cursor move inside the reader are positions,
 *   not new documents → `replace`.
 * - Adopting the current URL (a deep link, Back, Forward) writes nothing.
 *
 * The store records *why* the URL should move in `historyIntent`; this effect is
 * the only consumer, and it clears the intent after one write. A non-null intent
 * therefore only ever means "a state change is waiting for its address" — a URL
 * the desktop has not adopted yet competing with it is always the URL's turn.
 */
export function DesktopUrlSync() {
  const t = useTranslations("shell");
  // A unit test has no router; the navigation hook returns null there by design.
  const pathname = usePathname() ?? null;
  const router = useRouter();

  const windows = useWorkstationStore((state) => state.windows);
  const lastFocused = useWorkstationStore((state) => state.lastFocused);
  const readerTrail = useWorkstationStore((state) => state.readerTrail);
  const hydrated = useWorkstationStore((state) => state.hydrated);
  const historyIntent = useWorkstationStore((state) => state.historyIntent);
  const open = useWorkstationStore((state) => state.open);
  const openRecord = useWorkstationStore((state) => state.openRecord);
  const clearHistoryIntent = useWorkstationStore(
    (state) => state.clearHistoryIntent,
  );

  const focused = useMemo(
    () => focusedResource(windows, lastFocused, readerTrail),
    [windows, lastFocused, readerTrail],
  );

  /**
   * The URL we last asked the router for, and the focus it described.
   *
   * The router applies an address asynchronously, so for a render or two the
   * pathname still names the previous resource. Without this guard the effect
   * would read that stale pathname as "the URL wins", adopt it back, and undo
   * the navigation it just asked for.
   */
  const pending = useRef<{ url: string; key: string | null } | null>(null);

  /**
   * An address we asked for that the desktop outran.
   *
   * Closing a window immediately after opening it is the ordinary case: the
   * push is already in flight, so the close cannot cancel it. When that address
   * finally lands the desktop has moved on, and adopting it would reopen the
   * window the operator just closed. Remember the target instead, and correct
   * the address when it arrives.
   */
  const stale = useRef<string | null>(null);

  /*
   * Back and Forward supersede any write this component asked for. A push can
   * still be in flight when the operator presses Back, and that write's target
   * will never arrive; without this the guard would wait forever and the URL
   * would silently stop following the desktop.
   */
  useEffect(() => {
    const supersede = () => {
      pending.current = null;
    };
    window.addEventListener("popstate", supersede);
    return () => window.removeEventListener("popstate", supersede);
  }, []);

  useEffect(() => {
    // The URL is authoritative only after restored state has been merged and
    // validated; before that, the persisted merge could overwrite its window.
    if (pathname === null || !hydrated) return;

    const match = resourceFromPath(pathname);
    // The workstation cannot address an unknown path; the route already 404s.
    if (match.kind === "unknown") return;

    const urlResource = match.kind === "resource" ? match.resource : null;
    const urlKey = resourceKey(urlResource);
    const focusKey = resourceKey(focused);

    if (pending.current !== null) {
      if (pathname === pending.current.url) {
        pending.current = null;
      } else if (focusKey !== pending.current.key) {
        // The desktop moved on before the write landed; the old write no longer
        // describes it, so stop waiting — and remember it in case it arrives.
        stale.current = pending.current.url;
        pending.current = null;
      } else {
        return;
      }
    }

    // A write we had given up on has arrived. Put the address back on the
    // resource the desktop is actually showing instead of adopting it.
    if (stale.current !== null && pathname === stale.current) {
      stale.current = null;
      const next = pathForResource(focused);
      pending.current = { url: next, key: focusKey };
      router.replace(next);
      return;
    }

    if (focusKey === urlKey) {
      // In agreement: any pending intent has been satisfied by the address.
      if (historyIntent !== null) clearHistoryIntent();
      return;
    }

    // A state change is waiting for its address. Opening pushes a document;
    // everything else replaces the current position.
    if (historyIntent !== null) {
      const next = pathForResource(focused);
      pending.current = { url: next, key: focusKey };
      if (historyIntent === "push") router.push(next);
      else router.replace(next);
      clearHistoryIntent();
      return;
    }

    // A URL the desktop is not showing. This is a deep link, Back, or Forward,
    // so the address is authoritative: adopt it without writing anything.
    if (match.kind === "resource") {
      if (urlResource?.kind === "destination") {
        const spec = specForDestination(urlResource.id, t);
        if (spec) open(spec, "replace");
      } else if (urlResource?.kind === "record") {
        // `openRecord` moves the cursor when the code is already in the trail,
        // so Forward returns to an earlier visit instead of appending a new one.
        openRecord(urlResource.code, t("readerTitle"), "replace");
      }
      return;
    }

    // The bare workstation with a restored focus: the address follows the
    // desktop, which is what refresh-persistence needs and what a closed final
    // window is expressed as.
    if (focusKey !== null) {
      const next = pathForResource(focused);
      pending.current = { url: next, key: focusKey };
      router.replace(next);
    }
  }, [
    pathname,
    hydrated,
    focused,
    historyIntent,
    open,
    openRecord,
    clearHistoryIntent,
    router,
    t,
  ]);

  return null;
}
