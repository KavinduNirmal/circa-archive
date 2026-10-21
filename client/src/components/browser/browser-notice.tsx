"use client";

import { useTranslations } from "next-intl";
import { MessageBox } from "../ui/message-box";
import { BROWSER_NAME } from "./browser-identity";

/**
 * The browser's refusals and About box.
 *
 * Every notice names the policy that produced it, so a restriction reads as the
 * archive's rule rather than as a missing feature. The box itself is the shared
 * in-world message box; only the copy belongs here.
 *
 * The heading and the body are catalog keys. The reference is a policy or error
 * code, so it is filed verbatim in every language and does not enter a catalog.
 */
export type BrowserNoticeKind = "tab" | "navigation" | "policy" | "about";

type NoticeCopy = { headingKey: string; bodyKey: string; reference: string };

const COPY: Record<BrowserNoticeKind, NoticeCopy> = {
  tab: {
    headingKey: "noticeTabHeading",
    bodyKey: "noticeTabBody",
    reference: "LN-POLICY-07 / ERR_LOCAL_NETWORK_TAB",
  },
  navigation: {
    headingKey: "noticeNavigationHeading",
    bodyKey: "noticeNavigationBody",
    reference: "LN-POLICY-04 / ERR_LOCAL_NETWORK_HOST",
  },
  policy: {
    headingKey: "networkPolicy",
    bodyKey: "noticePolicyBody",
    reference: "LN-POLICY-07",
  },
  about: {
    headingKey: "aboutHeading",
    bodyKey: "noticeAboutBody",
    reference: "Build 1999.4 / CIRCA-OS",
  },
};

export function BrowserNotice({
  kind,
  attempted,
  onClose,
}: {
  kind: BrowserNoticeKind | null;
  /** The address a refused navigation was aimed at, quoted back in the notice. */
  attempted?: string;
  onClose: () => void;
}) {
  const t = useTranslations("browser");
  const copy = kind ? COPY[kind] : null;
  /*
   * Only the About heading interpolates the product name; the other messages
   * take no arguments, and an argument a message does not use is ignored.
   */
  const title =
    kind === "about"
      ? t("aboutTitle", { name: BROWSER_NAME })
      : copy
        ? BROWSER_NAME
        : "";
  return (
    <MessageBox
      open={kind !== null}
      title={title}
      heading={copy ? t(copy.headingKey, { name: BROWSER_NAME }) : ""}
      body={copy ? t(copy.bodyKey) : ""}
      reference={copy?.reference}
      detail={kind === "navigation" ? (attempted ?? null) : null}
      tone={kind === "about" ? "info" : "warning"}
      onClose={onClose}
    />
  );
}
