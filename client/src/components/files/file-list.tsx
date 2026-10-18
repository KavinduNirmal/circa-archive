"use client";

import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  FILE_TYPES,
  FOLDER_ICONS,
  SORT_KEYS,
  countLabel,
  describeNode,
  formatModified,
  formatSize,
  isFolder,
  type FileNode,
  type FileSortKey,
  type FileView,
  type SortDirection,
} from "./files-index";

/** The artwork a node shows, which is the one place the tree's shape reaches the listing. */
export function nodeIcon(node: FileNode): string {
  if (isFolder(node)) {
    if (node.id === "dir-archive") return FOLDER_ICONS.archive;
    if (node.id === "dir-recycle") return FOLDER_ICONS.recycle;
    if (node.id === "dir-expunged") return FOLDER_ICONS.expunged;
    if (node.id === "dir-system") return FOLDER_ICONS.system;
    if (node.id === "dir-work" || node.id.startsWith("case-")) return FOLDER_ICONS.work;
    return FOLDER_ICONS.closed;
  }
  return FILE_TYPES[node.ext]?.icon ?? FOLDER_ICONS.closed;
}

/** `/icons/<name>.png`, since the artwork table stores bare names. */
function iconUrl(name: string): string {
  return `/icons/${name}.png`;
}

export function folderIconUrl(open: boolean): string {
  return iconUrl(open ? FOLDER_ICONS.open : FOLDER_ICONS.closed);
}

/**
 * Where each column's name comes from.
 *
 * `files-index.ts` carries the tree and the sort keys, not the interface copy:
 * the label above a column and the label on a Sort by item are what the chrome
 * prints, so the names live in the `files` catalog and this record only maps a
 * sort key to its catalog key. A record rather than a key built from the sort
 * key, because the catalog is flat and camelCase.
 */
export const SORT_LABEL_KEYS: Record<FileSortKey, string> = {
  name: "sortName",
  type: "sortType",
  size: "sortSize",
  modified: "sortModified",
};

/**
 * The details columns after the name cell, which is drawn separately because it
 * carries the icon and the open control.
 *
 * One spec drives both the header row and the body rows. They were written out
 * separately at first, and they drifted: the header said Name, Type, Size while
 * the cells printed name, size, type, so every value sat under the wrong
 * heading. Reading one list twice is what makes that impossible.
 */
const COLUMNS: readonly FileSortKey[] = SORT_KEYS.filter((key) => key !== "name");

/**
 * The listing, in the three layouts the View menu offers.
 *
 * Large Icons gives every node a 32px bitmap, which is the size the 1998 artwork
 * was drawn at. Details is a sortable table with a checkbox per row, so Select
 * All and Invert selection have something to act on even though the volume
 * refuses every write.
 */
export function FileList({ view, nodes, sort, direction, selected, openFolder, onToggleSelected, onSort }: {
  view: FileView;
  nodes: readonly FileNode[];
  sort: FileSortKey;
  direction: SortDirection;
  selected: readonly string[];
  openFolder: (node: FileNode) => void;
  /** A row's checkbox selects the node and, for a folder, the branch beneath it. */
  onToggleSelected: (node: FileNode, next: boolean) => void;
  onSort: (key: FileSortKey) => void;
}) {
  const t = useTranslations("files");
  const isSelected = (id: string) => selected.includes(id);
  /** Enter or Space opens the focused node, which is how a mouse double-click behaves. */
  const keyOpen = (node: FileNode) => (event: React.KeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openFolder(node);
  };

  if (view === "icons") {
    return (
      <div className="files-listing" data-view="icons">
        <ul className="files-icons" role="list" aria-label={t("files")}>
          {nodes.map((node) => (
            <li key={node.id}>
              <button type="button" className="files-icon" data-node={node.id} aria-pressed={isSelected(node.id)}
                onDoubleClick={() => openFolder(node)} onClick={() => onToggleSelected(node, !isSelected(node.id))} onKeyDown={keyOpen(node)}>
                <Image className="files-icon-art" src={iconUrl(nodeIcon(node))} alt="" width={32} height={32} draggable={false} unoptimized />
                <span className="files-icon-label">{node.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (view === "list") {
    return (
      <div className="files-listing" data-view="list">
        <ul className="files-rows" role="list" aria-label={t("files")}>
          {nodes.map((node) => (
            <li key={node.id}>
              <button type="button" className="files-row" data-node={node.id} aria-pressed={isSelected(node.id)}
                onDoubleClick={() => openFolder(node)} onClick={() => onToggleSelected(node, !isSelected(node.id))} onKeyDown={keyOpen(node)}>
                <Image className="files-row-art" src={iconUrl(nodeIcon(node))} alt="" width={16} height={16} draggable={false} unoptimized />
                <span className="files-row-name">{node.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="files-listing" data-view="details">
      <table className="files-table" role="grid" aria-label={t("files")} data-nodes={nodes.length}>
        <thead>
          <tr>
            <th scope="col" className="files-col-check" aria-label={t("selectionColumn")} />
            {/* The name header sorts the listing but has no cell in the body loop. */}
            <th scope="col" className="files-col-name" aria-sort={sort === "name" ? direction : "none"}>
              <button type="button" className="files-sort" data-active={sort === "name" ? "true" : undefined} onClick={() => onSort("name")}>
                <SortGlyph active={sort === "name"} direction={direction} />
                <span className="files-sort-label">{t(SORT_LABEL_KEYS.name)}</span>
              </button>
            </th>
            {COLUMNS.map((column) => (
              <th key={column} scope="col" className={`files-col-${column}`}
                aria-sort={sort === column ? direction : "none"}>
                <button type="button" className="files-sort" data-active={sort === column ? "true" : undefined}
                  onClick={() => onSort(column)}>
                  <SortGlyph active={sort === column} direction={direction} />
                  <span className="files-sort-label">{t(SORT_LABEL_KEYS[column])}</span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {nodes.map((node) => (
            <tr key={node.id} className="files-tr" data-node={node.id} aria-selected={isSelected(node.id)}>
              <td className="files-col-check">
                <input type="checkbox" className="files-check" checked={isSelected(node.id)}
                  aria-label={t("selectNode", { name: node.name })} onChange={(event) => onToggleSelected(node, event.target.checked)} />
              </td>
              <td className="files-namecell">
                {/*
                  A span with a button's role rather than a button element: a
                  button inside a table cell replaces the cell in the
                  accessibility tree, so the row would lose its name cell.
                */}
                <span className="files-namebutton" role="button" tabIndex={0}
                  onDoubleClick={() => openFolder(node)}
                  onClick={() => (isFolder(node) ? openFolder(node) : onToggleSelected(node, !isSelected(node.id)))}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    if (isFolder(node)) openFolder(node);
                    else onToggleSelected(node, !isSelected(node.id));
                  }}>
                  <Image className="files-row-art" src={iconUrl(nodeIcon(node))} alt="" width={16} height={16} draggable={false} unoptimized />
                  <span className="files-row-name">{node.name}</span>
                </span>
              </td>
              {COLUMNS.map((column) => (
                <td key={column} className={`files-col-${column}`}>
                  {column === "size"
                    ? (isFolder(node) ? countLabel(node.id, t) : formatSize(node.size))
                    : column === "type"
                      ? describeNode(node, t)
                      : formatModified(node)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The header glyph: up, down, or the neutral double arrow when the column is idle. */
function SortGlyph({ active, direction }: { active: boolean; direction: SortDirection }) {
  if (!active) return <ChevronsUpDown className="files-sort-glyph" aria-hidden="true" />;
  return direction === "ascending"
    ? <ChevronUp className="files-sort-glyph" aria-hidden="true" />
    : <ChevronDown className="files-sort-glyph" aria-hidden="true" />;
}
