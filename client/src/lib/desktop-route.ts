import { ARCHIVE_INDEX } from "@/components/browser/archive-index";
import type { WorkstationWindowState } from "./desktop-types";
import { isDestinationId } from "./desktop-destinations";
import { currentCode, type RecordTrail } from "./record-trail";

/**
 * The mapping between a workstation URL and the resource it names.
 *
 * Pure by construction: the pages derive their static params from it, the URL
 * sync turns a pathname into a window, and the tests can hold every destination
 * and every archive code to the same round-trip without a router.
 *
 * The scheme is nested under the workstation so it cannot collide with the
 * public edition's addresses:
 *
 *   /desktop                       nothing focused
 *   /desktop/{destination}         one of the rail shortcuts, or System
 *   /desktop/record/{code}         the reader on an archive code
 *
 * The public `/{lang}/site/records/{code}` page stays the canonical, indexable
 * address for a record. A workstation URL is a workspace position.
 */

export type DesktopResource =
  { kind: "destination"; id: string } | { kind: "record"; code: string };

export type RouteMatch =
  | { kind: "root" }
  | { kind: "resource"; resource: DesktopResource }
  | { kind: "unknown" };

const RECORD_CODES = new Set(ARCHIVE_INDEX.map((entry) => entry.code));

/** Whether a code names an archive entry. Exact and case-sensitive, as the public record route is. */
export function isRecordCode(code: string): boolean {
  return RECORD_CODES.has(code);
}

/**
 * Decodes a path segment, leaving it untouched when it is malformed.
 *
 * A malformed escape cannot be a known destination or code anyway, so returning
 * the raw text keeps the match rules simple and the failure a 404 rather than a
 * thrown exception in a render.
 */
function decode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * The resource a locale-less pathname names.
 *
 * `usePathname` from `@/i18n/navigation` already removed the locale prefix, so a
 * leading `desktop` segment is required: any other path is not the workstation.
 *
 * Record codes may contain a slash (`ORG-C-005102/C1`), which cannot be written
 * as one path segment without encoding. Both forms resolve: `pathForResource`
 * writes the encoded one, and a pathname that arrives already decoded is joined
 * back together.
 */
export function resourceFromPath(pathname: string): RouteMatch {
  const segments = pathname.split("/").filter(Boolean).map(decode);
  if (segments[0] !== "desktop") return { kind: "unknown" };
  if (segments.length === 1) return { kind: "root" };

  if (segments[1] === "record") {
    // `record` with no code never resolves; it is not a destination either.
    if (segments.length < 3) return { kind: "unknown" };
    const code = segments.slice(2).join("/");
    return isRecordCode(code)
      ? { kind: "resource", resource: { kind: "record", code } }
      : { kind: "unknown" };
  }

  if (segments.length !== 2) return { kind: "unknown" };
  const id = segments[1];
  return isDestinationId(id)
    ? { kind: "resource", resource: { kind: "destination", id } }
    : { kind: "unknown" };
}

/** The locale-less pathname for a resource; `null` is the bare workstation. */
export function pathForResource(resource: DesktopResource | null): string {
  if (!resource) return "/desktop";
  if (resource.kind === "destination") return `/desktop/${resource.id}`;
  return `/desktop/record/${encodeURIComponent(resource.code)}`;
}

/** A comparable key for two resources, so a focus change can be detected without object identity. */
export function resourceKey(resource: DesktopResource | null): string | null {
  if (!resource) return null;
  return resource.kind === "destination"
    ? `destination:${resource.id}`
    : `record:${resource.code}`;
}

/**
 * The resource the desktop is actually showing.
 *
 * The reader is one window whose code comes from the trail cursor, so a record
 * resource is read from the trail rather than from the window. A stale focus id
 * falls back to the top visible frame, which is the same rule the store uses.
 */
export function focusedResource(
  windows: readonly WorkstationWindowState[],
  lastFocused: string | null,
  trail: RecordTrail,
): DesktopResource | null {
  if (windows.length === 0) return null;
  const visible = windows.filter((item) => !item.minimized);
  const focused =
    visible.find((item) => item.id === lastFocused) ??
    [...visible].sort((a, b) => b.z - a.z)[0];
  if (!focused) return null;

  if (focused.id === "reader") {
    const code = currentCode(trail);
    return code === null ? null : { kind: "record", code };
  }
  return isDestinationId(focused.id)
    ? { kind: "destination", id: focused.id }
    : null;
}
