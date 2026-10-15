"use client";

import { useState } from "react";
import { FolderTree } from "./folder-tree";
import { FileAddressBar, FileEmpty, FileMenu, FileStatus, FileToolbar, type FileActions, type FileViewState } from "./files-chrome";
import { EXPLORER_NAME } from "./files-identity";
import { FileList } from "./file-list";
import { FileNotice, propertiesFor, type FileNoticeKind } from "./files-notice";
import {
  FILE_TREE,
  SCOPES,
  addressOf,
  childrenOf,
  folderCounts,
  isFolder,
  isWithin,
  nodeById,
  pathOf,
  selectionSummary,
  sortNodes,
  subtreeOf,
  type FileNode,
  type FileSortKey,
  type FileView,
} from "./files-index";
import "./files.css";

/** The favourites the Go menu and the address bar's place list both offer. */
const PLACES: readonly { id: string; label: string }[] = [
  { id: "pc-drive", label: "My Computer" },
  { id: "dir-documents", label: "My Documents" },
  { id: "dir-archive", label: "Archive" },
  { id: "dir-organizations", label: "Organizations" },
  { id: "dir-system", label: "System Files" },
  { id: "dir-recycle", label: "Recycle Bin" },
  { id: "dir-expunged", label: "_EXPUNGED" },
];

/** Keeps a requested path inside the scope the window was opened in. */
function normalize(id: string | undefined, rootId: string): string {
  if (id && nodeById(id, FILE_TREE) && isWithin(id, rootId, FILE_TREE)) return id;
  return rootId;
}

/**
 * The tree state a window starts with: the folder it is showing and everything
 * above it, so the pane shows where the window is rather than a single collapsed
 * row the operator has to find and expand.
 */
function initialExpanded(start: string): string[] {
  return [...new Set([start, ...pathOf(start, FILE_TREE)])];
}

/**
 * The file browser, hosted by every folder destination on the desktop.
 *
 * One component serves My Computer, My Documents, My Work, Archive,
 * Organizations, System Files, the Recycle Bin, and _EXPUNGED: a scope decides
 * where it opens and which mount the address bar and status bar claim, and
 * everything else is the same navigation, listing, and selection behaviour.
 *
 * The archive mount is read only by policy, so the file operations are refused
 * with a named reason rather than hidden; selection itself is real, which is why
 * Select All, Invert selection, and the row checkboxes all work.
 */
export function FileExplorer({ scopeId, initialPath, initialView = "details", onCloseWindow }: {
  /** Which destination opened this window. An unknown id falls back to My Computer. */
  scopeId: string;
  /** Optional starting folder, used when a case is opened from its own folder. */
  initialPath?: string;
  /** Layout the window opens in; Details is the one that shows everything. */
  initialView?: FileView;
  onCloseWindow: () => void;
}) {
  const scope = SCOPES.find((item) => item.id === scopeId) ?? SCOPES[0];
  const start = normalize(initialPath ?? scope.rootId, scope.rootId);
  const [currentId, setCurrentId] = useState<string>(start);
  const [history, setHistory] = useState<string[]>([start]);
  const [cursor, setCursor] = useState(0);
  const [state, setState] = useState<FileViewState>({ view: initialView, sort: "name", direction: "ascending" });
  const [expanded, setExpanded] = useState<string[]>(() => initialExpanded(start));
  const [selected, setSelected] = useState<string[]>([]);
  const [notice, setNotice] = useState<FileNoticeKind | null>(null);
  const [properties, setProperties] = useState<ReturnType<typeof propertiesFor>>(null);
  const [status, setStatus] = useState<string | null>(null);

  const folder = nodeById(currentId, FILE_TREE) ?? FILE_TREE[0];
  const counts = folderCounts(folder.id, FILE_TREE);
  const listed = sortNodes(childrenOf(folder.id, FILE_TREE), state.sort, state.direction, state.view, FILE_TREE);
  const canGoBack = cursor > 0;
  const canGoForward = cursor < history.length - 1;
  const canGoUp = folder.parent !== null;
  const place = PLACES.some((item) => item.id === currentId) ? currentId : scope.rootId;

  function update(next: Partial<FileViewState>) {
    setState((current) => ({ ...current, ...next }));
  }

  /** Opens a folder in the pane without navigating to it. */
  function toggleExpanded(id: string) {
    setExpanded((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  /**
   * Navigates and records the step, which is what Back and Forward replay. The
   * folder already on screen is not a step, and neither is a target the scope
   * cannot reach: the tree pane walks the whole store, so a click on another
   * mount is answered in the status bar instead of silently doing nothing.
   */
  function navigate(id: string) {
    const target = nodeById(id, FILE_TREE);
    if (!target) return;
    if (!isWithin(id, scope.rootId, FILE_TREE)) {
      setStatus(`${target.name} is outside ${scope.title}. Open it from its own desktop shortcut.`);
      return;
    }
    if (id === currentId) return;
    setHistory((current) => [...current.slice(0, cursor + 1), id]);
    setCursor(cursor + 1);
    setCurrentId(id);
    setExpanded((current) => [...new Set([...current, id, ...pathOf(id, FILE_TREE)])]);
    setSelected([]);
    setStatus(null);
  }

  function travel(delta: number) {
    const target = cursor + delta;
    if (target < 0 || target >= history.length) return;
    const destination = history[target];
    const name = nodeById(destination, FILE_TREE)?.name ?? "";
    setCursor(target);
    setCurrentId(destination);
    setExpanded((current) => [...new Set([...current, destination, ...pathOf(destination, FILE_TREE)])]);
    setSelected([]);
    setStatus(`${delta < 0 ? "Back to" : "Forward to"} ${name}.`);
  }

  function refresh() {
    setStatus(`${folder.name} reloaded. The listing is unchanged on a read-only volume.`);
  }

  function openFolder(node: FileNode) {
    if (isFolder(node)) {
      navigate(node.id);
      return;
    }
    // TODO: Hand the record to the archive reader once the two screens share a router.
    setStatus(`${node.name} is filed read-only. Opening it in the archive reader is not connected yet.`);
  }

  /** A folder's checkbox covers the branch under it, which is what the tri-state means. */
  function toggleBranch(node: FileNode, next: boolean) {
    const branch = isFolder(node) ? subtreeOf(node.id, FILE_TREE).map((item) => item.id) : [node.id];
    setSelected((current) => (next
      ? [...new Set([...current, ...branch])]
      : current.filter((id) => !branch.includes(id))));
    setStatus(null);
  }

  function selectAll() {
    setSelected(listed.map((node) => node.id));
    setStatus(`Selected all ${listed.length} items in ${folder.name}.`);
  }

  function invert() {
    const shown = new Set(listed.map((node) => node.id));
    setSelected((current) => [
      ...listed.filter((node) => !current.includes(node.id)).map((node) => node.id),
      ...current.filter((id) => !shown.has(id)),
    ]);
    setStatus("Selection inverted.");
  }

  /** A header click sorts by that column, or flips the direction on the active one. */
  function onSort(key: FileSortKey) {
    if (key === state.sort) update({ direction: state.direction === "ascending" ? "descending" : "ascending" });
    else update({ sort: key, direction: "ascending" });
  }

  function openProperties() {
    setProperties(propertiesFor(folder, counts.folders, counts.files));
    setNotice("properties");
  }

  const actions: FileActions = {
    back: () => travel(-1),
    forward: () => travel(1),
    up: () => { if (folder.parent) navigate(folder.parent); },
    refresh,
    selectAll,
    invert,
    close: onCloseWindow,
    goTo: navigate,
    policies: {
      create: () => setNotice("create"),
      clipboard: () => setNotice("clipboard"),
      delete: () => setNotice("delete"),
      rename: () => setNotice("rename"),
      empty: () => setNotice("empty"),
      about: () => setNotice("about"),
      policy: () => setNotice("policy"),
      properties: openProperties,
    },
  };

  const summary = scope.summary
    ?? `${counts.folders + counts.files} object${counts.folders + counts.files === 1 ? "" : "s"} (${counts.folders} folders, ${counts.files} files)`;
  const emptyHint = scope.id === "expunged"
    ? "Expunged records are removed from discoverability. There is no listing to open."
    : null;

  return (
    <div className="files" data-scope={scope.id} data-view={state.view}>
      <FileMenu state={state} setState={update} canGoBack={canGoBack} canGoForward={canGoForward} canGoUp={canGoUp} actions={actions} />
      <FileToolbar state={state} setState={update} canGoBack={canGoBack} canGoForward={canGoForward} canGoUp={canGoUp}
        showEmptyBin={scope.id === "recycle"} onEmptyBin={actions.policies.empty} actions={actions} />
      <FileAddressBar address={addressOf(folder.id, FILE_TREE)} up={canGoUp} places={PLACES} current={place} actions={actions} />
      <div className="files-body">
        <FolderTree rootId="pc-root" currentId={folder.id} expanded={expanded}
          onToggle={toggleExpanded} onSelect={navigate} tree={FILE_TREE} />
        <div className="files-main">
          <div className="files-pathbar">
            <span className="files-path-label">{EXPLORER_NAME}</span>
            <span className="files-path-crumb">{addressOf(folder.id, FILE_TREE)}</span>
          </div>
          {listed.length === 0
            ? <FileEmpty folder={folder.name} summary={scope.summary ?? null} hint={emptyHint} />
            : <FileList view={state.view} nodes={listed} sort={state.sort} direction={state.direction}
                selected={selected} openFolder={openFolder} onToggleSelected={toggleBranch} onSort={onSort} />}
        </div>
      </div>
      <FileStatus summary={summary} selection={status ?? selectionSummary(selected, FILE_TREE)} reference={scope.reference ?? "CIRCA-OS 4.12"} />
      <FileNotice kind={notice} properties={properties} onClose={() => { setNotice(null); setProperties(null); }} />
    </div>
  );
}
