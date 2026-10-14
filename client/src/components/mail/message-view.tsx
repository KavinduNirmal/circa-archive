"use client";

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

const COMPOSE_TITLES: Record<ComposeKind, string> = {
  new: "New message",
  reply: "Reply",
  "reply-all": "Reply all",
  forward: "Forward",
};

const STAMP_LABELS: Partial<Record<MailFolderId, string>> = {
  outbox: "Queued",
  drafts: "Edited",
  sent: "Sent",
  dead: "Returned",
};

/**
 * The reading pane. It shows the header block, then the returned reason for a
 * dead letter, then the body, so the one message that cannot be delivered says
 * why before it says anything else.
 */
export function ReadingPane({ message }: { message: MailMessage }) {
  return (
    <section className="mail-reading" aria-label="Message">
      <div className="mail-reading-head">
        <h2 className="mail-subject">{message.subject}</h2>
        <dl className="mail-headers">
          <dt>From</dt>
          <dd>{message.from.name} &lt;{message.from.address}&gt;</dd>
          <dt>To</dt>
          <dd>{messageRecipients(message)}</dd>
          <dt>{STAMP_LABELS[message.folder] ?? "Received"}</dt>
          <dd className="circa-mono">{message.received}</dd>
        </dl>
      </div>
      {message.returned && (
        <p className="mail-returned-notice"><strong>Returned by the relay.</strong> {message.returned}</p>
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
      <p className="mail-reading-note">
        Held in the store this terminal owns. The correspondence transport is not connected, so this message cannot be forwarded off the terminal.
      </p>
    </section>
  );
}

/** What the pane shows when nothing is open: the folder's own summary, not a blank. */
export function ReadingEmpty({ folderLabel, items }: { folderLabel: string; items: number }) {
  return (
    <section className="mail-reading mail-reading-empty" aria-label="Message">
      <p className="mail-empty-title">{folderLabel}</p>
      <p>{items === 0
        ? "This folder is empty."
        : "Choose a message to read it here. Arrow keys move through the list once it has focus."}</p>
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
  return (
    <form className="mail-compose" aria-label={COMPOSE_TITLES[draft.kind]}
      onSubmit={(event) => { event.preventDefault(); onSend(); }}>
      <div className="mail-compose-head">
        <label className="mail-compose-label" htmlFor="mail-compose-to">To</label>
        <input id="mail-compose-to" className="mail-compose-field circa-mono" type="text"
          autoComplete="off" spellCheck={false} value={draft.to}
          onChange={(event) => onChange({ ...draft, to: event.target.value })} />
        <label className="mail-compose-label" htmlFor="mail-compose-subject">Subject</label>
        <input id="mail-compose-subject" className="mail-compose-field" type="text"
          autoComplete="off" value={draft.subject}
          onChange={(event) => onChange({ ...draft, subject: event.target.value })} />
      </div>
      <label className="sr-only" htmlFor="mail-compose-body">Message</label>
      <textarea id="mail-compose-body" className="mail-compose-body" value={draft.body}
        onChange={(event) => onChange({ ...draft, body: event.target.value })} />
      <div className="mail-compose-actions">
        <button type="submit" className="mail-compose-send">Send</button>
        <button type="button" className="mail-compose-discard" onClick={onDiscard}>Discard</button>
        <span className="mail-compose-note">
          Queued in the Outbox. Nothing leaves the terminal until a transport is connected.
        </span>
      </div>
    </form>
  );
}

/**
 * Builds the draft a toolbar action starts from. Replies address the sender and
 * quote the original the way the reference client did; forwards address nobody,
 * because the operator picks the recipient.
 */
export function draftFrom(kind: ComposeKind, message: MailMessage | null): ComposeDraft {
  if (kind === "new" || !message) return { kind, to: "", subject: "", body: "" };
  const quote = [
    "",
    "",
    "-----Original Message-----",
    `From: ${message.from.name} <${message.from.address}>`,
    `Received: ${message.received}`,
    `Subject: ${message.subject}`,
    "",
    ...message.body,
  ].join("\n");
  if (kind === "forward") {
    return { kind, to: "", subject: `FW: ${message.subject}`, body: quote };
  }
  const others = kind === "reply-all"
    ? [message.from, ...message.to.filter((address) => address.address !== MAILBOX_ADDRESS.address)]
    : [message.from];
  return {
    kind,
    to: others.map((address) => address.address).join("; "),
    subject: message.subject.startsWith("RE: ") ? message.subject : `RE: ${message.subject}`,
    body: quote,
  };
}
