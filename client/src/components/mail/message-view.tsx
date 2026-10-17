"use client";

import { useTranslations } from "next-intl";
import { Paperclip } from "lucide-react";
import { MAILBOX_ADDRESS, messageRecipients, type MailFolderId, type MailMessage } from "./mailbox-index";

/** The reply, reply-all, and forward the toolbar can start, plus a fresh message. */
export type ComposeKind = "new" | "reply" | "reply-all" | "forward";

export type ComposeDraft = {
  kind: ComposeKind;
  to: string;
  subject: string;
  body: string;
};

type Translate = (key: string, values?: Record<string, string | number>) => string;

/** The `mail` namespace key holding each composer's own name. */
const COMPOSE_KEYS: Record<ComposeKind, string> = {
  new: "composeNew",
  reply: "composeReply",
  "reply-all": "composeReplyAll",
  forward: "composeForward",
};

/** What the store stamped a message with, which depends on the folder holding it. */
const STAMP_KEYS: Partial<Record<MailFolderId, string>> = {
  outbox: "stampQueued",
  drafts: "stampEdited",
  sent: "stampSent",
  dead: "stampReturned",
};

/**
 * The reading pane. It shows the header block, then the returned reason for a
 * dead letter, then the body, so the one message that cannot be delivered says
 * why before it says anything else.
 */
export function ReadingPane({ message }: { message: MailMessage }) {
  const t = useTranslations("mail");
  const stampKey = STAMP_KEYS[message.folder];
  return (
    <section className="mail-reading" aria-label={t("readingLabel")}>
      <div className="mail-reading-head">
        <h2 className="mail-subject">{message.subject}</h2>
        <dl className="mail-headers">
          <dt>{t("columnFrom")}</dt>
          <dd>{message.from.name} &lt;{message.from.address}&gt;</dd>
          <dt>{t("headerTo")}</dt>
          <dd>{messageRecipients(message)}</dd>
          <dt>{stampKey ? t(stampKey) : t("columnReceived")}</dt>
          <dd className="circa-mono">{message.received}</dd>
        </dl>
      </div>
      {message.returned && (
        <p className="mail-returned-notice"><strong>{t("returnedByRelay")}</strong> {message.returned}</p>
      )}
      {message.attachments?.length ? (
        <p className="mail-attachments">
          <Paperclip className="mail-glyph" aria-hidden="true" />
          {message.attachments.join(", ")}
        </p>
      ) : null}
      <div className="mail-letter">
        {message.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      </div>
      <p className="mail-reading-note">{t("readingNote")}</p>
    </section>
  );
}

/** What the pane shows when nothing is open: the folder's own summary, not a blank. */
export function ReadingEmpty({ folderLabel, items }: { folderLabel: string; items: number }) {
  const t = useTranslations("mail");
  return (
    <section className="mail-reading mail-reading-empty" aria-label={t("readingLabel")}>
      <p className="mail-empty-title">{folderLabel}</p>
      <p>{items === 0 ? t("emptyFolder") : t("chooseMessage")}</p>
    </section>
  );
}

/**
 * The composer, in the pane rather than in a second window.
 *
 * `Send` queues the message in the Outbox, which is what the reference client did
 * with mail it could not hand to a transport, so nothing here pretends to have
 * been delivered. The note under the buttons says where the message goes.
 */
export function ComposePane({ draft, onChange, onSend, onDiscard }: {
  draft: ComposeDraft;
  onChange: (next: ComposeDraft) => void;
  onSend: () => void;
  onDiscard: () => void;
}) {
  const t = useTranslations("mail");
  return (
    <form className="mail-compose" aria-label={t(COMPOSE_KEYS[draft.kind])}
      onSubmit={(event) => { event.preventDefault(); onSend(); }}>
      <div className="mail-compose-head">
        <label className="mail-compose-label" htmlFor="mail-compose-to">{t("composeTo")}</label>
        <input id="mail-compose-to" className="mail-compose-field circa-mono" type="text"
          autoComplete="off" spellCheck={false} value={draft.to}
          onChange={(event) => onChange({ ...draft, to: event.target.value })} />
        <label className="mail-compose-label" htmlFor="mail-compose-subject">{t("composeSubject")}</label>
        <input id="mail-compose-subject" className="mail-compose-field" type="text"
          autoComplete="off" value={draft.subject}
          onChange={(event) => onChange({ ...draft, subject: event.target.value })} />
      </div>
      <label className="sr-only" htmlFor="mail-compose-body">{t("composeBody")}</label>
      <textarea id="mail-compose-body" className="mail-compose-body" value={draft.body}
        onChange={(event) => onChange({ ...draft, body: event.target.value })} />
      <div className="mail-compose-actions">
        <button type="submit" className="mail-compose-send">{t("send")}</button>
        <button type="button" className="mail-compose-discard" onClick={onDiscard}>{t("discard")}</button>
        <span className="mail-compose-note">{t("composeNote")}</span>
      </div>
    </form>
  );
}

/**
 * Builds the draft a toolbar action starts from. Replies address the sender and
 * quote the original the way the reference client did; forwards address nobody,
 * because the operator picks the recipient.
 *
 * It takes a translator because the quotation header is copy: the separator and
 * the field names are read by a correspondent, and the `RE:` test is written
 * against the translated prefix so a language that words it differently still
 * refuses to stack a second one.
 */
export function draftFrom(kind: ComposeKind, message: MailMessage | null, t: Translate): ComposeDraft {
  if (kind === "new" || !message) return { kind, to: "", subject: "", body: "" };
  const quote = [
    "",
    "",
    t("originalMessage"),
    `${t("columnFrom")}: ${message.from.name} <${message.from.address}>`,
    `${t("columnReceived")}: ${message.received}`,
    `${t("composeSubject")}: ${message.subject}`,
    "",
    ...message.body,
  ].join("\n");
  if (kind === "forward") {
    return { kind, to: "", subject: t("forwardPrefix", { subject: message.subject }), body: quote };
  }
  const others = kind === "reply-all"
    ? [message.from, ...message.to.filter((address) => address.address !== MAILBOX_ADDRESS.address)]
    : [message.from];
  const replyPrefix = t("replyPrefix", { subject: "" });
  return {
    kind,
    to: others.map((address) => address.address).join("; "),
    subject: message.subject.startsWith(replyPrefix) ? message.subject : t("replyPrefix", { subject: message.subject }),
    body: quote,
  };
}
