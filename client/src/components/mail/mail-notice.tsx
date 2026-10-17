"use client";

import { useTranslations } from "next-intl";
import { MessageBox } from "../ui/message-box";
import { MAIL_NAME } from "./mail-identity";

/**
 * The mail client's refusals and About box.
 *
 * The retention notice is the one the fiction needs: the archive destroys
 * nothing, so an empty folder is a policy the operator should be able to read,
 * not a disabled button with no explanation.
 */
export type MailNoticeKind = "retention" | "about";

/** The `mail` namespace keys each notice reads. */
const NOTICE_KEYS: Record<MailNoticeKind, { heading: string; body: string; reference: string }> = {
  retention: { heading: "retentionHeading", body: "retentionBody", reference: "retentionReference" },
  about: { heading: "aboutHeading", body: "aboutBody", reference: "aboutReference" },
};

export function MailNotice({ kind, onClose }: { kind: MailNoticeKind | null; onClose: () => void }) {
  const t = useTranslations("mail");
  const keys = kind ? NOTICE_KEYS[kind] : null;
  return (
    <MessageBox
      open={kind !== null}
      // The product name is a brand and does not translate; only the frame word does.
      title={kind === "about" ? t("aboutTitle", { name: MAIL_NAME }) : MAIL_NAME}
      heading={keys ? t(keys.heading) : ""}
      body={keys ? t(keys.body) : ""}
      reference={keys ? t(keys.reference) : undefined}
      tone={kind === "about" ? "info" : "warning"}
      onClose={onClose}
    />
  );
}
