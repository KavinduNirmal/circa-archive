"use client";

import { ChevronDown, ChevronRight, PanelLeft, PanelRight } from "lucide-react";
import { useId, useState, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { userCodeFor } from "./reader-identity";
import type { ReaderAnnotation } from "./reader-correspondence";
import type { ReaderSection } from "./reader-model";

/** A rail the reader has not touched follows the window; once touched, it obeys. */
export type RailState = "auto" | "open" | "closed";

/**
 * The two margins of the sheet.
 *
 * The left rail is the record's own shape: one preview per section, each drawn
 * as a small redacted leaf with its printed number and its heading. It is the
 * wayfinding, and it is section-based rather than page-based because a record
 * has sections; there are no page boundaries to find, and inventing them would
 * mean a rail that renumbers itself every time the window is resized.
 *
 * The right rail is other people: ruled paper, a red margin line, and notes
 * pinned to the section they were written beside. Correspondence is anchored to
 * a section rather than to a run of text, which is both what marginalia
 * actually does and the only anchoring that survives a re-render.
 */

export function SectionRail({ sections, activeId, rail, collapsed, onSelect, onToggle }: {
  sections: readonly ReaderSection[];
  activeId: string | null;
  /** What the reader asked for: `auto` follows the window, the rest is a decision. */
  rail: RailState;
  collapsed: boolean;
  onSelect: (id: string) => void;
  onToggle: () => void;
}) {
  const t = useTranslations("reader");
  return (
    <nav className="reader-rail reader-rail-left" data-rail={rail} data-collapsed={collapsed ? "true" : undefined}
      aria-label={t("sections")}>
      <div className="reader-rail-head">
        <h2 className="reader-rail-title circa-label">{t("sections")}</h2>
        <button type="button" className="reader-rail-toggle" aria-expanded={!collapsed} aria-controls="reader-sections" onClick={onToggle}>
          <PanelLeft className="reader-rail-toggle-glyph" aria-hidden="true" />
          <span className="sr-only">{collapsed ? t("showSections") : t("hideSections")}</span>
        </button>
      </div>
      {/*
        A section that is not in the record, for the length of one animation,
        after which the rail corrects itself. It is hidden from assistive
        technology and from the layout by its own styles rather than by state,
        so nothing has to remember that it happened.
      */}
      <div className="reader-preview-phantom" aria-hidden="true">
        <span className="reader-thumb"><span className="reader-thumb-page" /></span>
        <span className="reader-preview-text">
          <span className="reader-preview-index circa-mono">00</span>
          <span className="reader-preview-heading">{t("phantomHeading")}</span>
        </span>
      </div>
      <ol className="reader-previews" id="reader-sections">
        {sections.map((section) => (
          <li key={section.id}>
            <button type="button" className="reader-preview" aria-label={`${section.index} ${section.heading}`}
              aria-current={section.id === activeId ? "true" : undefined}
              data-withheld={section.withheld ? "true" : undefined}
              onClick={() => onSelect(section.id)}>
              <span className="reader-thumb"><span className="reader-thumb-page" /></span>
              <span className="reader-preview-text">
                <span className="reader-preview-index circa-mono">{section.index}</span>
                <span className="reader-preview-heading">{section.heading}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
      {sections.length === 0 && <p className="reader-rail-none">{t("noSections")}</p>}
    </nav>
  );
}

export function AnnotationRail({ notes, sections, activeHeading, rail, collapsed, draft, replyTo, composerRef, onDraftChange, onReply, onFile, onEndorse, onToggle }: {
  notes: readonly ReaderAnnotation[];
  sections: readonly ReaderSection[];
  activeHeading: string | null;
  rail: RailState;
  collapsed: boolean;
  draft: string;
  replyTo: string | null;
  composerRef: RefObject<HTMLTextAreaElement | null>;
  onDraftChange: (next: string) => void;
  onReply: (noteId: string | null) => void;
  onFile: () => void;
  onEndorse: (id: string) => void;
  onToggle: () => void;
}) {
  const t = useTranslations("reader");
  const threads = notes.flatMap((note) => [note, ...note.replies]);
  const replyTarget = replyTo ? threads.find((entry) => entry.id === replyTo) : undefined;
  /*
   * Notes are grouped by the section they were written beside, in the record's
   * own order rather than the order they were filed, so the margin reads down
   * the page the same way the sheet does.
   */
  const groups = sections
    .map((section) => ({ section, items: notes.filter((note) => note.sectionId === section.id) }))
    .filter((group) => group.items.length > 0);

  return (
    <aside className="reader-rail reader-rail-right" data-rail={rail} data-collapsed={collapsed ? "true" : undefined}
      aria-label={t("annotations")}>
      <div className="reader-rail-head">
        <h2 className="reader-rail-title circa-label">{t("annotations")}</h2>
        <span className="reader-annotation-count circa-mono" data-testid="reader-annotation-count">{notes.length}</span>
        <button type="button" className="reader-rail-toggle" aria-expanded={!collapsed} aria-controls="reader-annotations" onClick={onToggle}>
          <PanelRight className="reader-rail-toggle-glyph" aria-hidden="true" />
          <span className="sr-only">{collapsed ? t("showAnnotations") : t("hideAnnotations")}</span>
        </button>
      </div>

      <div className="reader-notes" id="reader-annotations">
        {notes.length === 0 && (
          <div className="reader-notes-empty">
            <p className="reader-notes-empty-title">{t("emptyMargin")}</p>
            <p className="reader-notes-empty-note">{t("emptyMarginNote")}</p>
          </div>
        )}
        {groups.map(({ section, items }) => (
          <div className="reader-note-group" key={section.id}>
            <h3 className="reader-note-group-heading circa-label">{section.heading}</h3>
            <ul className="reader-note-thread">
              {items.map((note) => (
                <li key={note.id}>
                  <NoteBlock note={note} onEndorse={onEndorse} onReply={onReply} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <form className="reader-composer" onSubmit={(event) => { event.preventDefault(); onFile(); }}>
        <p className="reader-composer-where circa-label">
          {replyTarget ? t("replyTo", { author: replyTarget.author }) : t("filingAgainst", { heading: activeHeading ?? t("theRecord") })}
        </p>
        <textarea className="reader-composer-input" ref={composerRef} rows={3} value={draft}
          placeholder={t("notePlaceholder")} aria-label={t("notePlaceholder")}
          onChange={(event) => onDraftChange(event.target.value)} />
        <div className="reader-composer-actions">
          <button type="submit" className="reader-composer-file">{t("fileNote")}</button>
          {replyTarget && (
            <button type="button" className="reader-composer-cancel" onClick={() => onReply(null)}>{t("cancel")}</button>
          )}
        </div>
      </form>
    </aside>
  );
}

/**
 * One note, with its replies below it. A reply carries no reply affordance of
 * its own.
 *
 * A note folds to its head, which is the whole point of a margin with a dozen
 * of them in it: the head still names the writer, their number, and the day, so
 * a folded note is still a note you can find. Folding is structural rather than
 * a style — the body, its actions, and its replies are `hidden` — so a folded
 * margin keeps nothing in the accessibility tree or the layout that the reader
 * cannot see. The nodes stay in the document, which is what lets the fold
 * control keep naming the region it folds.
 */
function NoteBlock({ note, onEndorse, onReply }: {
  note: ReaderAnnotation;
  onEndorse: (id: string) => void;
  onReply: (noteId: string | null) => void;
}) {
  const t = useTranslations("reader");
  const [folded, setFolded] = useState(false);
  const bodyId = useId();
  return (
    <article className="reader-note" data-folded={folded ? "true" : undefined}>
      <NoteHead author={note.author} when={note.when}
        fold={{ folded, controls: bodyId, onToggle: () => setFolded((current) => !current) }} />
      <div className="reader-note-rest" id={bodyId} hidden={folded}>
        <NoteBody body={note.body} />
        <div className="reader-note-actions">
          <EndorseButton id={note.id} count={note.noted} onEndorse={onEndorse} />
          <button type="button" className="reader-note-reply" onClick={() => onReply(note.id)}>{t("reply")}</button>
        </div>
        {note.replies.length > 0 && (
          <ul className="reader-replies">
            {note.replies.map((reply) => (
              <li key={reply.id}>
                <article className="reader-note reader-note-answer">
                  <NoteHead author={reply.author} when={reply.when} />
                  <NoteBody body={reply.body} />
                  <div className="reader-note-actions">
                    <EndorseButton id={reply.id} count={reply.noted} onEndorse={onEndorse} />
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

/**
 * Who wrote it, what they are numbered, and when it was filed.
 *
 * A reply shares the head with the note it answers, so the code sits under the
 * display name in both places. `fold` is present on a note and absent on a
 * reply: a reply is folded by the note above it, and giving it a control of its
 * own would suggest it can be put away on its own.
 */
function NoteHead({ author, when, fold }: {
  author: string;
  when: string;
  fold?: { folded: boolean; controls: string; onToggle: () => void };
}) {
  const t = useTranslations("reader");
  const code = userCodeFor(author);
  return (
    <header className="reader-note-head">
      {fold && (
        <button type="button" className="reader-note-fold" aria-expanded={!fold.folded} aria-controls={fold.controls} onClick={fold.onToggle}>
          {fold.folded
            ? <ChevronRight className="reader-note-caret" aria-hidden="true" />
            : <ChevronDown className="reader-note-caret" aria-hidden="true" />}
          <span className="sr-only">{fold.folded ? t("showNoteFrom", { author }) : t("hideNoteFrom", { author })}</span>
        </button>
      )}
      <span className="reader-note-who">
        <span className="reader-note-author">{author}</span>
        {code && <span className="reader-note-code circa-mono">{code}</span>}
      </span>
      <span className="reader-note-when circa-mono">{when}</span>
    </header>
  );
}

/**
 * What the writer typed, with the paragraph breaks they typed it with.
 *
 * A note is written in a plain textarea, so a blank line is a paragraph and a
 * single line break is a new line. Rendering the body as one run of text threw
 * both away and joined a long note into a single block, which is the one thing
 * a margin note cannot survive. The text keeps its newlines and the stylesheet
 * sets `pre-line`, so a line break stays a line break without preserving the
 * indentation of a pasted block.
 */
function NoteBody({ body }: { body: string }) {
  const paragraphs = body.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
  return (
    <>
      {paragraphs.map((paragraph, position) => (
        <p className="reader-note-body" key={`${position}-${paragraph.length}`}>{paragraph}</p>
      ))}
    </>
  );
}

function EndorseButton({ id, count, onEndorse }: { id: string; count: number; onEndorse: (id: string) => void }) {
  const t = useTranslations("reader");
  return (
    <button type="button" className="reader-note-noted" aria-label={t("notedCount", { count })} onClick={() => onEndorse(id)}>
      {t("noted")} <span className="reader-note-noted-count circa-mono">{count}</span>
    </button>
  );
}
