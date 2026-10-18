import { describe, expect, it } from "vitest";
import { ARCHIVE_INDEX } from "@/components/browser/archive-index";
import type { WorkstationWindowState } from "@/lib/desktop-types";
import { allDestinations } from "@/lib/desktop-destinations";
import { focusedResource, pathForResource, resourceFromPath, resourceKey } from "@/lib/desktop-route";

/**
 * The URL and the workstation are two views of the same focus, so the mapping
 * between them is pure and exhaustively tested. Every destination and every
 * archive code must round-trip: a shortcut with no address, or an address with
 * no window, is the drift this module exists to prevent.
 */
const destination = (id: string) => ({ kind: "destination" as const, id });
const record = (code: string) => ({ kind: "record" as const, code });

function resourceOf(pathname: string) {
  const match = resourceFromPath(pathname);
  return match.kind === "resource" ? match.resource : match.kind;
}

function windowState(id: string, overrides: Partial<WorkstationWindowState> = {}): WorkstationWindowState {
  return {
    id,
    title: id,
    status: null,
    icon: { glyph: "archive" },
    geometry: { x: 0, y: 0, width: 400, height: 300 },
    maximized: false,
    minimized: false,
    z: 1,
    ...overrides,
  };
}

describe("desktop route mapping", () => {
  it("maps the bare workstation to the root", () => {
    expect(resourceFromPath("/desktop")).toEqual({ kind: "root" });
    // A trailing slash is the same address.
    expect(resourceFromPath("/desktop/")).toEqual({ kind: "root" });
  });

  it("round-trips every destination", () => {
    for (const entry of allDestinations) {
      const path = pathForResource(destination(entry.id));
      expect(path).toBe(`/desktop/${entry.id}`);
      expect(resourceOf(path)).toEqual(destination(entry.id));
    }
  });

  it("round-trips every archive code, including the ones a path escapes", () => {
    for (const entry of ARCHIVE_INDEX) {
      const path = pathForResource(record(entry.code));
      expect(path).toBe(`/desktop/record/${encodeURIComponent(entry.code)}`);
      expect(resourceOf(path)).toEqual(record(entry.code));
    }
    // The continuity codes contain a slash; they are one segment, encoded.
    expect(pathForResource(record("ORG-C-005102/C1"))).toBe("/desktop/record/ORG-C-005102%2FC1");
  });

  it("reads a pathname that was already decoded back into segments", () => {
    // Next's pathname hook is allowed to hand over a decoded path; the same
    // record must resolve either way rather than depending on the encoding.
    expect(resourceOf("/desktop/record/ORG-C-005102/C1")).toEqual(record("ORG-C-005102/C1"));
  });

  it("rejects destinations and codes it does not know, without guessing", () => {
    expect(resourceOf("/desktop/nope")).toBe("unknown");
    expect(resourceOf("/desktop/record/NOPE")).toBe("unknown");
    // Every match is exact and case-sensitive, mirroring the public record route.
    expect(resourceOf("/desktop/Archive")).toBe("unknown");
    expect(resourceOf("/desktop/record/inc-00014")).toBe("unknown");
    // `record` alone would match the destination slot, and is not a destination.
    expect(resourceOf("/desktop/record")).toBe("unknown");
    expect(resourceOf("/desktop/record/INC-00014/extra")).toBe("unknown");
    expect(resourceOf("/desktop/archive/INC-00014")).toBe("unknown");
    expect(resourceOf("/")).toBe("unknown");
    expect(resourceOf("/site/records/INC-00014")).toBe("unknown");
  });

  it("uses a stable key so two calls can be compared", () => {
    expect(resourceKey(null)).toBeNull();
    expect(resourceKey(destination("archive"))).toBe("destination:archive");
    expect(resourceKey(record("INC-00014"))).toBe("record:INC-00014");
  });

  it("names the focused visible window, mapping the reader to its record", () => {
    const trail = { codes: ["INC-00014", "INC-00027"], at: 1 };
    expect(focusedResource([windowState("archive")], "archive", trail)).toEqual(destination("archive"));
    expect(focusedResource([windowState("reader", { maximized: true })], "reader", trail)).toEqual(record("INC-00027"));
    // A minimized focused window is not on the screen, so nothing is focused.
    expect(focusedResource([windowState("archive", { minimized: true })], "archive", trail)).toBeNull();
    // A reader with no record has nothing to name.
    expect(focusedResource([windowState("reader")], "reader", { codes: [], at: 0 })).toBeNull();
    expect(focusedResource([], null, trail)).toBeNull();
  });

  it("falls back to the top visible window when the stored focus is stale", () => {
    const windows = [
      windowState("archive", { z: 2 }),
      windowState("reader", { z: 1 }),
    ];
    // Restored state can carry a focus id that no longer resolves; the top
    // visible frame is still what the operator would call focused.
    expect(focusedResource(windows, "gone", { codes: ["INC-00014"], at: 0 })).toEqual(destination("archive"));
  });
});
