"use client";

import { useTranslations } from "next-intl";
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

type NoticeCopy = {
  title: string;
  heading: string;
  body: string;
  reference: string;
};

export function WordNotice({
  kind,
  onClose,
}: {
  kind: WordNoticeKind | null;
  onClose: () => void;
}) {
  const t = useTranslations("word");
  // The copy is read here rather than from a table of English strings, so the
  // notice a reader sees is the one their language's catalog holds. The brand
  // stays the constant the rest of the app reads; the archive codes stay codes.
  let copy: NoticeCopy | null = null;
  if (kind === "save") {
    copy = {
      title: WORD_NAME,
      heading: t("saveHeading"),
      body: t("saveBody"),
      reference: t("referenceSave"),
    };
  } else if (kind === "policy") {
    copy = {
      title: WORD_NAME,
      heading: t("filingPolicy"),
      body: t("policyBody"),
      reference: t("referencePolicy"),
    };
  } else if (kind === "about") {
    copy = {
      title: t("aboutLabel", { name: WORD_NAME }),
      heading: t("aboutHeading", { name: WORD_NAME }),
      body: t("aboutBody"),
      reference: t("referenceAbout"),
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
