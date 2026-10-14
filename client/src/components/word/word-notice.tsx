"use client";

import { MessageBox } from "../ui/message-box";
import { WORD_NAME } from "./word-identity";

/**
 * The editor's two notices: the refused filing and the About box.
 *
 * The refusal is the one place the fiction has to hold up on its own, because
 * `File > Save` is the first thing anyone reaches for. It names the policy that
 * stops it rather than failing quietly, and it says what would have happened.
 */
export type WordNoticeKind = "save" | "policy" | "about";

type NoticeCopy = { title: string; heading: string; body: string; reference: string };

const COPY: Record<WordNoticeKind, NoticeCopy> = {
  save: {
    title: WORD_NAME,
    heading: "This draft cannot be filed yet",
    body: "Filing a record needs the case, the organization, and the type, and those are chosen by the filing key rather than by the editor. This workstation holds the draft until that key is present, so the document stays in the window.",
    reference: "LN-POLICY-26 / KEY_FILING_AUTHORITY",
  },
  policy: {
    title: WORD_NAME,
    heading: "Filing policy",
    body: "Records are written in Markdown and filed as .pdf into a case folder. What this editor writes is a draft: it is not indexed, not discoverable, and not citable until the filing key assigns it a case code. Drafts are held on the local volume and never leave the terminal.",
    reference: "LN-POLICY-12 / RECORD_FILING",
  },
  about: {
    title: `About ${WORD_NAME}`,
    heading: `${WORD_NAME} 2000`,
    body: "Document editor for CIRCA/OS. Writes the archive's record format: Markdown, filed as .pdf into a case folder. This build carries the markdown tools and the local draft store; filing metadata and the record reader are separate.",
    reference: "Build 1999.4 / CIRCA-OS",
  },
};

export function WordNotice({ kind, onClose }: { kind: WordNoticeKind | null; onClose: () => void }) {
  const copy = kind ? COPY[kind] : null;
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
