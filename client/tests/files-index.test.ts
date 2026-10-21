import { describe, expect, it } from "vitest";
import { translatorFor } from "./intl";
import {
  FILE_TREE,
  SCOPES,
  breadcrumbOf,
  childrenOf,
  countLabel,
  describeNode,
  fileTypeOf,
  folderCounts,
  formatModified,
  formatSize,
  isFolder,
  isWithin,
  nodeById,
  pathOf,
  scopeById,
  selectionState,
  sortNodes,
  type FileNode,
  type FileView,
  scopeSummary,
  scopeTitle,
} from "@/components/files/files-index";

/**
 * A small canvas with both kinds of nodes and one level of nesting, so the pure
 * helpers are exercised in isolation. `f` is the root, `a` a folder inside it,
 * and `b` the empty folder that makes the depth checks meaningful.
 */
const FOLDER: FileNode = {
  id: "a",
  name: "Alpha",
  kind: "folder",
  parent: "f",
  opened: "2003-01-02 08:00",
  note: "A folder.",
};
const EMPTY: FileNode = {
  id: "b",
  name: "Blank",
  kind: "folder",
  parent: "a",
  opened: "1999-12-31 23:50",
};
const PDF: FileNode = {
  id: "c",
  name: "CASE_BRIEF.pdf",
  kind: "file",
  ext: "pdf",
  parent: "f",
  size: 412,
  modified: "2003-02-10 14:05",
};
const TXT: FileNode = {
  id: "d",
  name: "zulu.txt",
  kind: "file",
  ext: "txt",
  parent: "f",
  size: 9,
  modified: "2003-02-11 09:15",
};
const EML: FileNode = {
  id: "e",
  name: "LOG-002_ORG-B.eml",
  kind: "file",
  ext: "eml",
  parent: "f",
  size: 1024,
  modified: "2000-06-05 11:00",
};
const ROOT: FileNode = {
  id: "f",
  name: "Root",
  kind: "folder",
  parent: null,
  opened: "2003-02-11 08:00",
};
const CANVAS: readonly FileNode[] = [ROOT, FOLDER, EMPTY, PDF, TXT, EML];

describe("file tree lookups", () => {
  it("finds a node by id and reports its path and breadcrumb", () => {
    expect(nodeById("c", CANVAS)?.name).toBe("CASE_BRIEF.pdf");
    expect(nodeById("missing", CANVAS)).toBeUndefined();
    expect(pathOf("c", CANVAS)).toEqual(["f"]);
    expect(breadcrumbOf("c", CANVAS)?.map((node) => node.name)).toEqual([
      "Root",
      "CASE_BRIEF.pdf",
    ]);
    expect(pathOf("b", CANVAS)).toEqual(["f", "a"]);
    expect(pathOf("f", CANVAS)).toEqual([]);
    expect(breadcrumbOf("nope", CANVAS)).toBeUndefined();
  });

  it("lists a folder's children and counts what they are", () => {
    expect(
      childrenOf("f", CANVAS)
        .map((node) => node.id)
        .sort(),
    ).toEqual(["a", "c", "d", "e"]);
    expect(childrenOf("b", CANVAS)).toEqual([]);
    expect(folderCounts("f", CANVAS)).toEqual({ folders: 1, files: 3 });
    expect(childrenOf("b", CANVAS).filter(isFolder)).toEqual([]);
  });

  it("knows whether a node sits inside a scope, and that a scope contains itself", () => {
    expect(isWithin("b", "a", CANVAS)).toBe(true);
    expect(isWithin("c", "f", CANVAS)).toBe(true);
    expect(isWithin("a", "a", CANVAS)).toBe(true);
    expect(isWithin("b", "a", CANVAS)).toBe(true);
    expect(isWithin("a", "c", CANVAS)).toBe(false);
    expect(isWithin("c", "b", CANVAS)).toBe(false);
  });
});

/** The shipped English catalog, so these assertions pin the words a reader sees. */
const files = translatorFor("files");

describe("sorting", () => {
  const ids = (
    view: FileView,
    key: "name" | "type" | "size" | "modified",
    direction: "ascending" | "descending",
  ) =>
    sortNodes(childrenOf("f", CANVAS), key, direction, view, files, CANVAS).map(
      (node) => node.id,
    );

  it("orders names and reverses only the files when the direction flips", () => {
    expect(ids("details", "name", "ascending")).toEqual(["a", "c", "e", "d"]);
    expect(ids("details", "name", "descending")).toEqual(["a", "d", "e", "c"]);
  });

  it("orders by type, size, and modified", () => {
    expect(ids("details", "type", "ascending")).toEqual(["a", "e", "c", "d"]);
    expect(ids("details", "size", "ascending")).toEqual(["a", "d", "c", "e"]);
    expect(ids("details", "modified", "ascending")).toEqual([
      "a",
      "e",
      "c",
      "d",
    ]);
    expect(ids("details", "modified", "descending")).toEqual([
      "a",
      "d",
      "c",
      "e",
    ]);
  });

  it("keeps the stored order in the views that have no column headers to sort by", () => {
    expect(ids("icons", "size", "ascending")).toEqual(["a", "c", "d", "e"]);
    expect(ids("list", "size", "ascending")).toEqual(["a", "c", "d", "e"]);
  });
});

describe("selection and tri-state", () => {
  /*
   * The checkbox beside a folder shows the state of the branch under it, which
   * is the same rule Explorer used: a folder is checked when every node beneath
   * it is selected, unchecked when none is, and mixed in between.
   */
  it("reads checked, unchecked, and mixed from the branch below a folder", () => {
    expect(selectionState("f", [], CANVAS)).toBe("unchecked");
    expect(selectionState("f", ["a", "b", "c", "d", "e"], CANVAS)).toBe(
      "checked",
    );
    expect(selectionState("f", ["a", "c", "d", "e"], CANVAS)).toBe("mixed");
    expect(selectionState("a", [], CANVAS)).toBe("unchecked");
    expect(selectionState("a", ["b"], CANVAS)).toBe("checked");
  });

  it("calls a node checked on its own selection, not the state of anything else", () => {
    expect(selectionState("c", ["c"], CANVAS)).toBe("checked");
    expect(selectionState("c", [], CANVAS)).toBe("unchecked");
    // A folder is checked on its own selection even while its contents are not.
    expect(selectionState("a", ["a"], CANVAS)).toBe("checked");
  });

  it("treats a node outside the branch as irrelevant", () => {
    // `c`, `d`, and `e` are siblings of `a`, so they say nothing about `a`.
    expect(selectionState("a", ["c", "d", "e"], CANVAS)).toBe("unchecked");
    expect(selectionState("b", ["a", "c"], CANVAS)).toBe("unchecked");
  });
});

describe("type and size presentation", () => {
  it("labels a file by its extension and a folder by its kind", () => {
    expect(fileTypeOf(PDF, files)).toBe("Record document");
    expect(fileTypeOf(EML, files)).toBe("Filed email");
    expect(fileTypeOf(FOLDER, files)).toBe("File folder");
    expect(
      fileTypeOf(
        {
          id: "x",
          name: "X.weird",
          kind: "file",
          ext: "weird" as never,
          parent: null,
          size: 1,
          modified: "2003-01-01 00:00",
        },
        files,
      ),
    ).toBe("Unregistered file");
    // The two unreadable cases stay distinct: one is a known orphan, the other an
    // extension the table has never heard of.
    expect(
      fileTypeOf(
        {
          id: "y",
          name: "ORPHAN.bin",
          kind: "file",
          ext: "bin",
          parent: null,
          size: 1,
          modified: "2003-01-01 00:00",
        },
        files,
      ),
    ).toBe("Unreadable binary");
  });

  it("describes a node for the status bar", () => {
    expect(describeNode(PDF, files)).toBe("Record document (PDF)");
    expect(describeNode(FOLDER, files)).toBe("File folder (empty)");
    expect(describeNode(EMPTY, files)).toBe("File folder (empty)");
  });

  it("formats a size that a 1998 listing could have shown", () => {
    expect(formatSize(0)).toBe("0 KB");
    expect(formatSize(900)).toBe("1 KB");
    expect(formatSize(1024)).toBe("1 KB");
    expect(formatSize(41_000)).toBe("40 KB");
    expect(formatSize(3 * 1024 * 1024)).toBe("3.0 MB");
  });

  it("formats the modified stamp the listing shows", () => {
    expect(formatModified(EML)).toBe("2000-06-05 11:00");
    expect(formatModified(FOLDER)).toBe("2003-01-02 08:00");
  });

  it("counts a folder's contents the way the size column reads", () => {
    expect(countLabel("f", files, CANVAS)).toBe("3 files, 1 folder");
    expect(countLabel("b", files, CANVAS)).toBe("empty");
  });
});

describe("the shipped tree and its scopes", () => {
  it("keeps every child's parent pointing back at a real folder", () => {
    const byId = new Map(FILE_TREE.map((node) => [node.id, node]));
    for (const node of FILE_TREE) {
      expect(new Set(FILE_TREE.map((item) => item.id)).size).toBe(
        FILE_TREE.length,
      );
      if (node.parent === null) continue;
      const parent = byId.get(node.parent);
      expect(parent, `${node.id} has no parent`).toBeDefined();
      expect(parent?.kind, `${node.id} is filed inside a file`).toBe("folder");
    }
  });

  it("gives every node the fields its kind requires", () => {
    // The `isFolder` assertion below narrows the union for the rest of the loop
    // body, so each node is inspected through its own discriminant instead.
    for (const node of FILE_TREE) {
      expect(node.name.length).toBeGreaterThan(0);
      expect(node.id).toBe(node.id.toLowerCase());
      if (node.kind === "file") {
        expect(node.ext, `${node.id} has no extension`).toBeDefined();
        expect(node.size, `${node.id} has no size`).toBeGreaterThan(0);
        expect(node.modified, `${node.id} has no modified stamp`).toMatch(
          /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/,
        );
        expect(node.ext, `${node.id} is a file with no extension`).toBeTruthy();
      } else {
        expect("ext" in node, `${node.id} is a folder with an extension`).toBe(
          false,
        );
        expect(node.opened, `${node.id} has no opened stamp`).toMatch(
          /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/,
        );
      }
    }
  });

  it("honours the case folder rules: two levels of nesting and flat evidence", () => {
    const depth = (node: FileNode) => pathOf(node.id, FILE_TREE).length;
    // A case folder is a direct child of Archive; the case roots sit at depth 3.
    const cases = childrenOf("dir-archive", FILE_TREE);
    expect(cases.length).toBeGreaterThan(4);
    expect(cases.every((node) => depth(node) === 3)).toBe(true);
    const inside = FILE_TREE.filter((node) =>
      cases.some((root) => isWithin(node.id, root.id, FILE_TREE)),
    );
    // Two levels at most: the case root's own children, and one nested folder's children.
    expect(inside.every((node) => depth(node) <= 5)).toBe(true);
    expect(inside.some((node) => depth(node) === 5)).toBe(true);
    // Evidence stays flat on the case root rather than being filed away.
    const evidence = inside.filter(
      (node) => !isFolder(node) && (node.ext === "jpg" || node.ext === "png"),
    );
    expect(evidence.length).toBeGreaterThan(0);
    expect(
      evidence.every((node) => cases.some((root) => node.parent === root.id)),
    ).toBe(true);
  });

  it("routes each scope to a folder that exists and contains what it promises", () => {
    for (const scope of SCOPES) {
      const root = nodeById(scope.rootId, FILE_TREE);
      expect(root, `${scope.id} points at a missing folder`).toBeDefined();
      expect(root?.kind, `${scope.id} points at a file`).toBe("folder");
    }
    expect(scopeTitle(scopeById("my-pc")!, files)).toBe("My Computer");
    expect(scopeById("archive")).toBeDefined();
    expect(scopeById("nope")).toBeUndefined();
  });

  it("keeps _EXPUNGED empty but still countable", () => {
    const expunged = SCOPES.find((scope) => scope.id === "expunged");
    expect(expunged).toBeDefined();
    expect(childrenOf(expunged!.rootId, FILE_TREE)).toEqual([]);
    expect(scopeSummary(expunged!, files)).toMatch(/^\d+ records expunged\.$/);
  });

  it("files every archive record with a code the case folder names", () => {
    const filed = childrenOf("dir-archive", FILE_TREE);
    expect(filed.length).toBeGreaterThan(0);
    expect(filed.every(isFolder)).toBe(true);
    expect(filed.every((node) => /^CIRCA-/.test(node.name))).toBe(true);
  });
});
