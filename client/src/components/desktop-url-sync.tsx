"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { focusedResource, resourceFromPath, resourceKey } from "@/lib/desktop-route";
import { specForDestination } from "@/lib/desktop-windows";
import { useWorkstationStore } from "@/stores/workstation-store-provider";

/**
 * The workstation's one routing surface.
 *
 * It renders nothing and is the only component in the workspace that reads the
 * pathname; keeping the shell router-free is what lets every shell test run
 * without a router mock, and what leaves exactly one place to reason about
 * history.
 *
 * URL → state: when the address names a resource the desktop is not showing,
 * open or focus it. A destination reuses the store's open, so a deep link and a
 * clicked shortcut produce the same frame; a record goes through `openRecord`,
 * which moves the trail cursor when the code is already there rather than
 * appending a second visit.
 *
 * `replace` is deliberate: this effect is reconciling to an address that already
 * exists, not navigating to a new one, so it must never grow the history stack.
 */
export function DesktopUrlSync() {
  const t = useTranslations("shell");
  // A unit test has no router; the navigation hook returns null there by design.
  const pathname = usePathname() ?? null;
  const windows = useWorkstationStore((state) => state.windows);
  const lastFocused = useWorkstationStore((state) => state.lastFocused);
  const readerTrail = useWorkstationStore((state) => state.readerTrail);
  const hydrated = useWorkstationStore((state) => state.hydrated);
  const open = useWorkstationStore((state) => state.open);
  const openRecord = useWorkstationStore((state) => state.openRecord);

  const focused = useMemo(
    () => focusedResource(windows, lastFocused, readerTrail),
    [windows, lastFocused, readerTrail],
  );

  useEffect(() => {
    // The URL is authoritative only after restored state has been merged and
    // validated; before that, the persisted merge could overwrite its window.
    if (pathname === null || !hydrated) return;
    const match = resourceFromPath(pathname);
    // The bare workstation and an unknown address open nothing; the latter is
    // already a 404 from the route, not a window.
    if (match.kind !== "resource") return;
    if (resourceKey(match.resource) === resourceKey(focused)) return;

    if (match.resource.kind === "destination") {
      const spec = specForDestination(match.resource.id, t);
      if (spec) open(spec, "replace");
      return;
    }
    openRecord(match.resource.code, t("readerTitle"), "replace");
  }, [pathname, hydrated, focused, open, openRecord, t]);

  return null;
}
