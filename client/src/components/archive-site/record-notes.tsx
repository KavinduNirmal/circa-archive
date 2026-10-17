"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { PenLine, Send } from "lucide-react";
import buttonStyles from "./archive-button.module.css";
import styles from "./archive-site.module.css";

/**
 * The correspondence at the foot of a record.
 *
 * The vocabulary is the workstation's, so a reader who has met these notes in
 * the viewer finds the same words here: annotations, a note filed by a
 * correspondent, a reply to a correspondent, a cancel that puts the composer
 * back to the record. The difference is where a note goes. This edition has no
 * writing desk, so what the composer produces is a draft held in the browser,
 * printed in the list under a `Not filed` stamp — the reader can see exactly
 * which copy they are looking at and take it away themselves.
 *
 * It is the only client component on the page. Everything else — the sheet, the
 * prose, the registers — is server HTML, so a reader who never opens the
 * composer downloads no Markdown parser and runs no state.
 */

export type RecordNoteView = {
  id: string;
  author: string;
  when: string;
  paragraphs: readonly string[];
  replies: readonly {
    id: string;
    author: string;
    when: string;
    paragraphs: readonly string[];
  }[];
};

export type RecordNoteLabels = {
  title: string;
  lead: string;
  empty: string;
  composerTitle: string;
  composerHint: string;
  name: string;
  namePlaceholder: string;
  body: string;
  bodyPlaceholder: string;
  submit: string;
  anonymous: string;
  draft: string;
  draftWhen: string;
  discard: string;
  reply: string;
  replyTo: string;
  cancel: string;
  held: string;
};

type Draft = {
  id: string;
  author: string;
  when: string;
  paragraphs: string[];
};

/** The composer's ceiling. A note is marginalia, not a second filing. */
const MAX_LENGTH = 1200;

export function RecordNotes({ notes, labels }: {
  notes: readonly RecordNoteView[];
  labels: RecordNoteLabels;
}) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [replies, setReplies] = useState<Record<string, Draft[]>>({});
  const [replyTo, setReplyTo] = useState<{ id: string; author: string } | null>(null);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const nextDraft = useRef(0);
  const composer = useRef<HTMLTextAreaElement>(null);

  const ready = body.trim().length > 0;
  const title = replyTo ? labels.replyTo.replace("{author}", replyTo.author) : labels.composerTitle;

  // A reply moves the composer under the reader's hands, so it is focused for them.
  useEffect(() => {
    if (replyTo) composer.current?.focus();
  }, [replyTo]);

  function file(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = body.trim();
    if (!text) return;
    nextDraft.current += 1;
    const draft: Draft = {
      id: `held-note-${nextDraft.current}`,
      author: name.trim() || labels.anonymous,
      when: labels.draftWhen,
      paragraphs: text.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean),
    };

    if (replyTo) {
      setReplies((held) => ({ ...held, [replyTo.id]: [...(held[replyTo.id] ?? []), draft] }));
      setReplyTo(null);
    } else {
      setDrafts((held) => [draft, ...held]);
    }

    setBody("");
    setAnnouncement(labels.held);
  }

  function discard(id: string) {
    setDrafts((held) => held.filter((draft) => draft.id !== id));
  }

  function discardReply(noteId: string, id: string) {
    setReplies((held) => ({ ...held, [noteId]: (held[noteId] ?? []).filter((draft) => draft.id !== id) }));
  }

  return (
    <section className={styles.notes} id="notes" aria-labelledby="notes-title">
      <div className={styles.notesHead}>
        <h2 className={styles.notesTitle} id="notes-title">{labels.title}</h2>
        <span className={styles.notesCount}>{notes.length}</span>
      </div>
      <p className={styles.notesLead}>{labels.lead}</p>

      <div className={styles.noteList}>
        {drafts.map((draft) => (
          <article className={styles.noteCard} data-draft="true" key={draft.id}>
            <p className={styles.noteMeta}>
              <span className={styles.noteAuthor}>{draft.author}</span>
              <span className={styles.noteWhen}>
                <span className={styles.draftStamp}>{labels.draft}</span>
                {draft.when}
              </span>
            </p>
            <div className={styles.noteBody}>
              {draft.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            </div>
            <p className={styles.noteActions}>
              <button
                type="button"
                className={styles.noteAction}
                onClick={() => discard(draft.id)}
                aria-label={`${labels.discard}: ${draft.author}`}
              >
                {labels.discard}
              </button>
            </p>
          </article>
        ))}

        {notes.map((note) => (
          <article className={styles.noteCard} key={note.id}>
            <p className={styles.noteMeta}>
              <span className={styles.noteAuthor}>{note.author}</span>
              <span className={styles.noteWhen}>{note.when}</span>
            </p>
            <div className={styles.noteBody}>
              {note.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            </div>

            {note.replies.map((reply) => (
              <div className={styles.noteReply} key={reply.id}>
                <p className={styles.noteMeta}>
                  <span className={styles.noteAuthor}>{reply.author}</span>
                  <span className={styles.noteWhen}>{reply.when}</span>
                </p>
                <div className={styles.noteBody}>
                  {reply.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                </div>
              </div>
            ))}

            {(replies[note.id] ?? []).map((draft) => (
              <div className={styles.noteReply} data-draft="true" key={draft.id}>
                <p className={styles.noteMeta}>
                  <span className={styles.noteAuthor}>{draft.author}</span>
                  <span className={styles.noteWhen}>
                    <span className={styles.draftStamp}>{labels.draft}</span>
                    {draft.when}
                  </span>
                </p>
                <div className={styles.noteBody}>
                  {draft.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                </div>
                <p className={styles.noteActions}>
                  <button
                    type="button"
                    className={styles.noteAction}
                    onClick={() => discardReply(note.id, draft.id)}
                    aria-label={`${labels.discard}: ${draft.author}`}
                  >
                    {labels.discard}
                  </button>
                </p>
              </div>
            ))}

            <p className={styles.noteActions}>
              <button
                type="button"
                className={styles.noteAction}
                onClick={() => setReplyTo({ id: note.id, author: note.author })}
                aria-label={labels.replyTo.replace("{author}", note.author)}
              >
                {labels.reply}
              </button>
            </p>
          </article>
        ))}

        {notes.length === 0 && drafts.length === 0 && (
          <p className={styles.notesEmpty}>{labels.empty}</p>
        )}
      </div>

      <form className={styles.composer} onSubmit={file} aria-labelledby="note-composer-title">
        <h3 className={styles.composerTitle} id="note-composer-title">
          <PenLine aria-hidden size={13} />
          {title}
        </h3>

        <div className={styles.composerFields}>
          <label className={styles.composerField}>
            <span className={styles.fieldLabel}>{labels.name}</span>
            <input
              className={styles.fieldInput}
              name="note-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={labels.namePlaceholder}
              autoComplete="name"
              maxLength={80}
            />
          </label>

          <label className={`${styles.composerField} ${styles.composerNote}`}>
            <span className={styles.fieldLabel}>{labels.body}</span>
            <textarea
              ref={composer}
              className={styles.fieldArea}
              name="note-body"
              rows={4}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={labels.bodyPlaceholder}
              maxLength={MAX_LENGTH}
              required
            />
          </label>
        </div>

        <div className={styles.composerFoot}>
          <p className={styles.composerHint}>{labels.composerHint}</p>
          <span className={styles.composerCount} aria-hidden="true">
            {body.length} / {MAX_LENGTH}
          </span>
          {replyTo ? (
            <button
              type="button"
              className={styles.noteAction}
              onClick={() => setReplyTo(null)}
            >
              {labels.cancel}
            </button>
          ) : null}
          <button type="submit" className={buttonStyles.button} data-tone="paper" disabled={!ready}>
            <Send aria-hidden size={12} />
            {labels.submit}
          </button>
        </div>

        <p className={styles.visuallyHidden} role="status">{announcement}</p>
      </form>
    </section>
  );
}
