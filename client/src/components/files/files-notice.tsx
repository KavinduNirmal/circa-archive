"use client";

import { useTranslations } from "next-intl";
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
export type FileNoticeKind =
  | "create"
  | "clipboard"
  | "delete"
  | "rename"
  | "about"
  | "policy"
  | "empty"
  | "properties";

type NoticeCopy = {
  title: string;
  heading: string;
  body: string;
  reference: string;
};

/** Counts and clearance for the Properties box, which is the one notice with data in it. */
export type FolderProperties = {
  node: FileFolder;
  items: number;
  folders: number;
  files: number;
  clearance: string | null;
};

export function FileNotice({
  kind,
  properties,
  onClose,
}: {
  kind: FileNoticeKind | null;
  /** Supplied when the notice is a folder's Properties sheet. */
  properties?: FolderProperties | null;
  onClose: () => void;
}) {
  const t = useTranslations("files");
  if (kind === "properties" && properties) {
    const clearance = properties.clearance
      ? t("propertiesClearance", { clearance: properties.clearance })
      : "";
    return (
      <MessageBox
        open
        title={t("propertiesTitle", { name: properties.node.name })}
        heading={properties.node.name}
        body={properties.node.note ?? t("propertiesBody")}
        reference={t("propertiesReference")}
        detail={`${t("propertiesDetail", { items: properties.items, folders: properties.folders, files: properties.files })}${clearance}`}
        tone="info"
        onClose={onClose}
      />
    );
  }
  // The copy is read here rather than from a table of English strings, so the
  // notice a reader sees is the one their language's catalog holds. The brand
  // stays the constant the rest of the app reads; the archive codes stay codes.
  let copy: NoticeCopy | null = null;
  if (kind === "create") {
    copy = {
      title: EXPLORER_NAME,
      heading: t("noticeCreateHeading"),
      body: t("noticeCreateBody"),
      reference: t("referenceReadOnly"),
    };
  } else if (kind === "clipboard") {
    copy = {
      title: EXPLORER_NAME,
      heading: t("noticeClipboardHeading"),
      body: t("noticeClipboardBody"),
      reference: t("referenceFiling"),
    };
  } else if (kind === "delete") {
    copy = {
      title: EXPLORER_NAME,
      heading: t("noticeDeleteHeading"),
      body: t("noticeDeleteBody"),
      reference: t("referenceDisposal"),
    };
  } else if (kind === "rename") {
    copy = {
      title: EXPLORER_NAME,
      heading: t("noticeRenameHeading"),
      body: t("noticeRenameBody"),
      reference: t("referenceNameKey"),
    };
  } else if (kind === "about") {
    copy = {
      title: t("aboutExplorer", { name: EXPLORER_NAME }),
      heading: t("noticeAboutHeading", { name: EXPLORER_NAME }),
      body: t("noticeAboutBody"),
      reference: t("referenceAbout"),
    };
  } else if (kind === "policy") {
    copy = {
      title: EXPLORER_NAME,
      heading: t("storagePolicy"),
      body: t("noticePolicyBody"),
      reference: t("referenceStorage"),
    };
  } else if (kind === "empty") {
    copy = {
      title: EXPLORER_NAME,
      heading: t("noticeEmptyHeading"),
      body: t("noticeEmptyBody"),
      reference: t("referenceDisposal"),
    };
  }
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
export function propertiesFor(
  node: FileNode,
  folders: number,
  files: number,
): FolderProperties | null {
  if (node.kind !== "folder") return null;
  return {
    node,
    items: folders + files,
    folders,
    files,
    clearance: node.clearance ?? null,
  };
}
