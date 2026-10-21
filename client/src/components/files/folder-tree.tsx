"use client";

import { Plus, Minus } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { childrenOf, isFolder, type FileNode } from "./files-index";
import { folderIconUrl } from "./file-list";

/**
 * The tree pane on the left, the way a 1998 Explorer had one.
 *
 * It is a real `tree` with `treeitem` rows and `aria-expanded` on every folder
 * that has children, so a screen reader announces the shape of the store even
 * though disclosure is a click rather than an arrow key. The rows are buttons
 * inside the tree, and clicking one selects that folder.
 *
 * It always walks from the workstation root rather than from the scope, which is
 * what lets Archive reach My Documents without going home first; the explorer
 * clamps a jump to the scope it was opened in.
 */
export function FolderTree({
  rootId,
  currentId,
  expanded,
  onToggle,
  onSelect,
  tree,
}: {
  rootId: string;
  currentId: string;
  expanded: readonly string[];
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  tree: readonly FileNode[];
}) {
  const t = useTranslations("files");
  const root = tree.find((node) => node.id === rootId);
  if (!root) return null;
  return (
    <div className="files-treepane">
      <div className="files-treepane-heading">{t("folders")}</div>
      <ul className="files-tree" role="tree" aria-label={t("folders")}>
        <TreeLevel
          id={rootId}
          currentId={currentId}
          expanded={expanded}
          onToggle={onToggle}
          onSelect={onSelect}
          tree={tree}
        />
      </ul>
    </div>
  );
}

/** One row, plus its child folders when it is open. */
function TreeLevel({
  id,
  currentId,
  expanded,
  onToggle,
  onSelect,
  tree,
}: {
  id: string;
  currentId: string;
  expanded: readonly string[];
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  tree: readonly FileNode[];
}) {
  const t = useTranslations("files");
  const node = tree.find((item) => item.id === id);
  if (!node) return null;
  const kids = childrenOf(id, tree).filter(isFolder);
  const open = expanded.includes(id);
  return (
    <li
      role="treeitem"
      aria-expanded={kids.length > 0 ? open : undefined}
      aria-selected={id === currentId}
      className="files-treeitem"
    >
      <div
        className="files-treerow"
        data-current={id === currentId ? "true" : undefined}
      >
        {/*
          The twisty is the folder's disclosure, so its label names the folder:
          "Expand" alone repeats six times in a pane of six folders, and the
          folder's own name is already announced by the row beside it.
        */}
        {kids.length > 0 ? (
          <button
            type="button"
            className="files-twisty"
            aria-label={
              open
                ? t("collapseFolder", { name: node.name })
                : t("expandFolder", { name: node.name })
            }
            onClick={() => onToggle(id)}
          >
            {open ? (
              <Minus className="files-twisty-glyph" aria-hidden="true" />
            ) : (
              <Plus className="files-twisty-glyph" aria-hidden="true" />
            )}
          </button>
        ) : (
          <span className="files-twisty-spacer" aria-hidden="true" />
        )}
        <button
          type="button"
          className="files-treebutton"
          aria-current={id === currentId ? "true" : undefined}
          onClick={() => onSelect(id)}
        >
          <Image
            className="files-treeart"
            src={folderIconUrl(open)}
            alt=""
            width={16}
            height={16}
            draggable={false}
            unoptimized
          />
          <span className="files-treelabel">{node.name}</span>
          {node.clearance && (
            <span className="files-treeclearance">
              {node.clearance.replace("LEVEL ", "L")}
            </span>
          )}
        </button>
      </div>
      {open && kids.length > 0 && (
        <ul role="group" className="files-treegroup">
          {kids.map((kid) => (
            <TreeLevel
              key={kid.id}
              id={kid.id}
              currentId={currentId}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
              tree={tree}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
