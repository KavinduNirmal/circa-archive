"use client";

import { MessageBox } from "../ui/message-box";
import { EXPLORER_NAME } from "./files-identity";
import type { FileFolder, FileNode } from "./files-index";

/**
 * The explorer's refusals, folder properties, and About box.
 *
 * Every refusal names the policy that produced it, so the read-only filesystem
 * reads as the archive's rule rather than as four greyed-out buttons nobody can
 * explain. The box itself is the shared in-world message box; only the copy and
 * the properties listing belong here.
 */
export type FileNoticeKind = "create" | "clipboard" | "delete" | "rename" | "about" | "policy" | "empty" | "properties";

type NoticeCopy = { title: string; heading: string; body: string; reference: string };

const COPY: Record<Exclude<FileNoticeKind, "properties">, NoticeCopy> = {
  create: {
    title: EXPLORER_NAME,
    heading: "The archive volume is read only",
    body: "Folders are created by the filing service when a case is opened, never from a workstation. This terminal holds a read-only mount of the archive, so nothing new can be written here.",
    reference: "LN-POLICY-23 / FS_READ_ONLY_VOLUME",
  },
  clipboard: {
    title: EXPLORER_NAME,
    heading: "Cut, copy, and paste are disabled",
    body: "Filed records are referenced by their case, not copied between folders. Moving one would leave the incident file without the record it cites, so the filing service refuses both directions on this volume.",
    reference: "LN-POLICY-24 / FS_FILING_BY_SERVICE",
  },
  delete: {
    title: EXPLORER_NAME,
    heading: "Nothing can be deleted from here",
    body: "Disposal is a scheduled act with a named officer attached to it. The retention schedule has no disposal line for this volume, so deletion is refused at the filesystem.",
    reference: "LN-POLICY-19 / FS_NO_DISPOSAL_LINE",
  },
  rename: {
    title: EXPLORER_NAME,
    heading: "Names are assigned at filing",
    body: "A record's name carries its case code, and the index is keyed on that name. Renaming is refused so a filed record cannot be separated from the code that finds it.",
    reference: "LN-POLICY-25 / FS_NAME_IS_KEY",
  },
  about: {
    title: `About ${EXPLORER_NAME}`,
    heading: `${EXPLORER_NAME} 4.12`,
    body: "Workstation file browser for CIRCA/OS. This build lists the local volume and the archive mount it exposes: My Documents, Archive, Organizations, System, the Recycle Bin, and _EXPUNGED. The archive mount is read only.",
    reference: "Build 1999.4 / CIRCA-OS",
  },
  policy: {
    title: EXPLORER_NAME,
    heading: "Storage policy",
    body: "The local volume holds drafts and exports. The archive mount holds filed records and cases. Recycle Bin items are recoverable for thirty days, after which the retention schedule decides. _EXPUNGED holds nothing and reports a count instead: expunged records are removed from discoverability entirely, so there is no listing to open.",
    reference: "LN-POLICY-19 / LN-POLICY-22",
  },
  empty: {
    title: EXPLORER_NAME,
    heading: "Recycle Bin cannot be emptied",
    body: "Emptying would dispose of recoverable records ahead of the retention schedule, which has no disposal line for this volume. The bin is emptied by that schedule when the thirty days elapse.",
    reference: "LN-POLICY-19 / FS_NO_DISPOSAL_LINE",
  },
};

/** Counts and clearance for the Properties box, which is the one notice with data in it. */
export type FolderProperties = { node: FileFolder; items: number; folders: number; files: number; clearance: string | null };

export function FileNotice({ kind, properties, onClose }: {
  kind: FileNoticeKind | null;
  /** Supplied when the notice is a folder's Properties sheet. */
  properties?: FolderProperties | null;
  onClose: () => void;
}) {
  if (kind === "properties" && properties) {
    return (
      <MessageBox
        open
        title={`${properties.node.name} Properties`}
        heading={properties.node.name}
        body={properties.node.note ?? "File folder."}
        reference={`CIRCA-OS 4.12 / LOCAL VOLUME`}
        detail={`${properties.items} objects (${properties.folders} folders, ${properties.files} files)${properties.clearance ? ` | clearance ${properties.clearance}` : ""}`}
        tone="info"
        onClose={onClose}
      />
    );
  }
  const copy = kind && kind !== "properties" ? COPY[kind] : null;
  return (
    <MessageBox
      open={kind !== null}
      title={copy?.title ?? ""}
      heading={copy?.heading ?? ""}
      body={copy?.body ?? ""}
      reference={copy?.reference}
      tone={kind === "about" || kind === "policy" ? "info" : "warning"}
      onClose={onClose}
    />
  );
}

/** The Properties sheet for a folder, derived from the tree rather than stored on it. */
export function propertiesFor(node: FileNode, folders: number, files: number): FolderProperties | null {
  if (node.kind !== "folder") return null;
  return { node, items: folders + files, folders, files, clearance: node.clearance ?? null };
}
