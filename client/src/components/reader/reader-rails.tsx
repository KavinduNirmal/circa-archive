"use client";

import { PanelLeft, PanelRight } from "lucide-react";
import type { RefObject } from "react";
import { READER_VOCABULARY } from "./reader-identity";
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
  return (
    <nav className="reader-rail reader-rail-left" data-rail={rail} data-collapsed={collapsed ? "true" : undefined}
      aria-label={READER_VOCABULARY.sections}>
      <div className="reader-rail-head">
        <h2 className="reader-rail-title circa-label">{READER_VOCABULARY.sections}</h2>
        <button type="button" className="reader-rail-toggle" aria-expanded={!collapsed} aria-controls="reader-sections" onClick={onToggle}>
          <PanelLeft className="reader-rail-toggle-glyph" aria-hidden="true" />
          <span className="sr-only">{collapsed ? "Show sections" : "Hide sections"}</span>
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
          <span className="reader-preview-heading">Preliminary review</span>
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
      {sections.length === 0 && <p className="reader-rail-none">No sections are filed for this record.</p>}
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
      aria-label={READER_VOCABULARY.annotations}>
      <div className="reader-rail-head">
        <h2 className="reader-rail-title circa-label">{READER_VOCABULARY.annotations}</h2>
        <span className="reader-annotation-count circa-mono" data-testid="reader-annotation-count">{notes.length}</span>
        <button type="button" className="reader-rail-toggle" aria-expanded={!collapsed} aria-controls="reader-annotations" onClick={onToggle}>
          <PanelRight className="reader-rail-toggle-glyph" aria-hidden="true" />
          <span className="sr-only">{collapsed ? "Show annotations" : "Hide annotations"}</span>
        </button>
      </div>

      <div className="reader-notes" id="reader-annotations">
        {notes.length === 0 && (
          <div className="reader-notes-empty">
            <p className="reader-notes-empty-title">{READER_VOCABULARY.emptyMargin}</p>
            <p className="reader-notes-empty-note">{READER_VOCABULARY.emptyMarginNote}</p>
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
          {replyTarget ? `Reply to ${replyTarget.author}` : `Filing against ${activeHeading ?? "the record"}`}
        </p>
        <textarea className="reader-composer-input" ref={composerRef} rows={3} value={draft}
          placeholder={READER_VOCABULARY.notePlaceholder} aria-label={READER_VOCABULARY.notePlaceholder}
          onChange={(event) => onDraftChange(event.target.value)} />
        <div className="reader-composer-actions">
          <button type="submit" className="reader-composer-file">File note</button>
          {replyTarget && (
            <button type="button" className="reader-composer-cancel" onClick={() => onReply(null)}>Cancel</button>
          )}
        </div>
      </form>
    </aside>
  );
}

/** One note, with its replies below it. A reply carries no reply affordance of its own. */
function NoteBlock({ note, onEndorse, onReply }: {
  note: ReaderAnnotation;
  onEndorse: (id: string) => void;
  onReply: (noteId: string | null) => void;
}) {
  return (
    <article className="reader-note">
      <header className="reader-note-head">
        <span className="reader-note-author">{note.author}</span>
        <span className="reader-note-when circa-mono">{note.when}</span>
      </header>
      <p className="reader-note-body">{note.body}</p>
      <div className="reader-note-actions">
        <EndorseButton id={note.id} count={note.noted} onEndorse={onEndorse} />
        <button type="button" className="reader-note-reply" onClick={() => onReply(note.id)}>Reply</button>
      </div>
      {note.replies.length > 0 && (
        <ul className="reader-replies">
          {note.replies.map((reply) => (
            <li key={reply.id}>
              <article className="reader-note reader-note-answer">
                <header className="reader-note-head">
                  <span className="reader-note-author">{reply.author}</span>
                  <span className="reader-note-when circa-mono">{reply.when}</span>
                </header>
                <p className="reader-note-body">{reply.body}</p>
                <div className="reader-note-actions">
                  <EndorseButton id={reply.id} count={reply.noted} onEndorse={onEndorse} />
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function EndorseButton({ id, count, onEndorse }: { id: string; count: number; onEndorse: (id: string) => void }) {
  return (
    <button type="button" className="reader-note-noted" aria-label={`Noted ${count}`} onClick={() => onEndorse(id)}>
      {READER_VOCABULARY.noted} <span className="reader-note-noted-count circa-mono">{count}</span>
    </button>
  );
}
