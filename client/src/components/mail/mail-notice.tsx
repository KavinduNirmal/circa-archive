"use client";

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

type NoticeCopy = { title: string; heading: string; body: string; reference: string };

const COPY: Record<MailNoticeKind, NoticeCopy> = {
  retention: {
    title: MAIL_NAME,
    heading: "Deleted items cannot be emptied",
    body: "The retention schedule has no disposal line. Deleted items are removed from this view when the store is rebuilt, and this store has not been rebuilt.",
    reference: "LN-POLICY-19 / RETENTION-SCHEDULE-0",
  },
  about: {
    title: `About ${MAIL_NAME}`,
    heading: `${MAIL_NAME} 4.12`,
    body: "Internal use only. This build reads the terminal's own correspondence store. Sending requires the correspondence transport, which is not connected, so messages wait in the Outbox.",
    reference: "Build 1999.4 / CIRCA-OS",
  },
};

export function MailNotice({ kind, onClose }: { kind: MailNoticeKind | null; onClose: () => void }) {
  const copy = kind ? COPY[kind] : null;
  return (
    <MessageBox
      open={kind !== null}
      title={copy?.title ?? ""}
      heading={copy?.heading ?? ""}
      body={copy?.body ?? ""}
      reference={copy?.reference}
      tone={kind === "about" ? "info" : "warning"}
      onClose={onClose}
    />
  );
}
