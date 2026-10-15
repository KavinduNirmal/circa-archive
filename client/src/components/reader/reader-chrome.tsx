"use client";

import { AlertDialog, DropdownMenu } from "radix-ui";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  FileKey,
  LayoutGrid,
  MessageSquare,
  MoveHorizontal,
  Printer,
  RotateCw,
  TextSearch,
  Type,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useId, type RefObject } from "react";
import { READER_NAME, READER_VOCABULARY } from "./reader-identity";
import { ASSESSMENT_SCALE, DOCUMENT_SIZES, READER_FONTS, READER_VIEWS, fontLabel, formatScale, scaleLimit, viewLabel, type ReaderFont, type ReaderView } from "./reader-model";
import type { ReaderVerdict } from "./reader-session";

/**
 * The reader's furniture: the toolbar that spans the top and the credentials
 * prompt the engagement controls raise.
 *
 * Two zones, and the split is the whole design of this bar. On the left are the
 * things you do to a document, which in a reader of this era is a row of small
 * machine plates; on the right are the things you do *about* a document, which
 * reads as bureaucracy: a worded assessment scale, a corroboration, a contest,
 * a note in the margin.
 *
 * Three of the left-hand controls are shipped and never wired: Rotate, Print,
 * and Download. They look exactly like the ones that work, they take focus, and
 * they fail silently. That is a deliberate departure from the rule the rest of
 * the workstation follows, where a control that cannot act says so on itself.
 * It is the one place in this shell where the software is older than its
 * promises, and Download is the single exception that states its reason,
 * because a clearance refusal is something the institution would say out loud.
 */

export type ReaderActions = {
  back: () => void;
  forward: () => void;
  setView: (view: ReaderView) => void;
  zoomOut: () => void;
  zoomIn: () => void;
  resetScale: () => void;
  /** A size chosen from the Text menu rather than stepped to. */
  setScale: (scale: number) => void;
  setFont: (font: ReaderFont) => void;
  toggleFit: () => void;
  toggleSearch: () => void;
  comment: () => void;
  assess: (value: number) => void;
  corroborate: () => void;
  contest: () => void;
  /** The one control that does nothing at all, named once so the intent is on the record. */
  inert: () => void;
  closeWindow: () => void;
};

export function ReaderToolbar({ code, view, scale, font, fit, matchRef, canGoBack, canGoForward, assessment, verdict, searchOpen, query, onQueryChange, actions }: {
  code: string | null;
  view: ReaderView;
  scale: number;
  /** How the reader has asked for the record to be set. */
  font: ReaderFont;
  fit: boolean;
  /** Written by the viewer's search effect, which is the only thing that can see the sheet. */
  matchRef: RefObject<HTMLSpanElement | null>;
  canGoBack: boolean;
  canGoForward: boolean;
  assessment: number | undefined;
  verdict: ReaderVerdict | null;
  searchOpen: boolean;
  query: string;
  onQueryChange: (next: string) => void;
  actions: ReaderActions;
}) {
  const assessmentLabelId = useId();
  return (
    <div className="reader-toolbar" role="toolbar" aria-label="Reader controls">
      <div className="reader-toolgroup">
        <ReaderAction label="Previous record" short="Back" icon={ArrowLeft} disabled={!canGoBack} title={canGoBack ? undefined : "This is the first record in the trail"} onClick={actions.back} />
        <ReaderAction label="Next record" short="Ahead" icon={ArrowRight} disabled={!canGoForward} title={canGoForward ? undefined : "No record ahead in the trail"} onClick={actions.forward} />
      </div>

      <span className="reader-divider" aria-hidden="true" />

      <div className="reader-toolgroup">
        <ViewMenu view={view} onChange={actions.setView} />
        <TextMenu font={font} scale={scale} onFont={actions.setFont} onScale={actions.setScale} />
        <ReaderAction label="Scale down" short="" icon={ZoomOut} disabled={scaleLimit(scale, -1)} title="The reader stops at 80 percent" onClick={actions.zoomOut} />
        <button type="button" className="reader-scale circa-sunken" title="Reset to 100 percent" onClick={actions.resetScale}>
          {/* The one flicker on open: a single frame of a scale that is not set. */}
          <span className="reader-scale-blip" aria-hidden="true">102%</span>
          <span className="reader-scale-value">{formatScale(scale)}</span>
        </button>
        <ReaderAction label="Scale up" short="" icon={ZoomIn} disabled={scaleLimit(scale, 1)} title="The reader stops at 160 percent" onClick={actions.zoomIn} />
        <ReaderAction label={READER_VOCABULARY.fitToMargin} short="Fit" icon={MoveHorizontal} pressed={fit} onClick={actions.toggleFit} />
        <ReaderAction label="Rotate" icon={RotateCw} onClick={actions.inert} />
        <ReaderAction label="Print" icon={Printer} onClick={actions.inert} />
        <ReaderAction label="Download" icon={Download} title="Unavailable at this clearance." onClick={actions.inert} />
      </div>

      <span className="reader-divider" aria-hidden="true" />

      <div className="reader-toolgroup">
        <ReaderAction label="Search" short="" icon={TextSearch} pressed={searchOpen} onClick={actions.toggleSearch} />
        {searchOpen && (
          <span className="reader-search circa-sunken">
            <input className="reader-search-input" type="search" aria-label="Search this record" spellCheck={false}
              autoComplete="off" value={query} onChange={(event) => onQueryChange(event.target.value)} />
          </span>
        )}
        {/*
          The match readout is written by the viewer's own search effect rather
          than by React, because the only thing that knows what is on the sheet
          is the sheet, and the renderer mounted in the slot is not ours.
        */}
        <span className="reader-match-count circa-mono" data-testid="reader-match-count" ref={matchRef} aria-live="polite" />
      </div>

      <span className="reader-toolbar-spacer" />

      <div className="reader-toolgroup reader-engagement">
        <ReaderAction label="Comment" short="" icon={MessageSquare} onClick={actions.comment} />
        {/*
          Quality, not agreement. A five-point institutional judgement, kept in
          its own group so it cannot be read as a vote.
        */}
        <div className="reader-assessment" role="radiogroup" aria-labelledby={assessmentLabelId}>
          <span className="reader-assessment-label circa-label" id={assessmentLabelId}>{READER_VOCABULARY.assessment}</span>
          <span className="reader-points">
            {ASSESSMENT_SCALE.map((label, value) => (
              // The blocks fill up to the grade reached, so the row reads as one
              // scale rather than as five unrelated buttons. The dash is the
              // absence of a judgement, so it is never part of the fill.
              <label className="reader-point" key={label} data-checked={assessment === value ? "true" : undefined}
                data-lit={value > 0 && assessment !== undefined && value <= assessment ? "true" : undefined}>
                {/* A real radio, so the scale keeps its arrow keys and its roving tab stop. */}
                <input className="reader-point-input" type="radio" name={`reader-assessment-${code ?? "none"}`}
                  value={value} checked={assessment === value} onChange={() => actions.assess(value)} />
                <span className="reader-point-word">{label}</span>
              </label>
            ))}
          </span>
          <span className="reader-assessment-score circa-mono" data-testid="reader-assessment-score">{assessment ?? 0}/5</span>
        </div>
        <ReaderAction label={READER_VOCABULARY.corroborate} icon={Check} tone="affirm" pressed={verdict === "corroborate"} onClick={actions.corroborate} />
        <ReaderAction label={READER_VOCABULARY.contest} icon={X} tone="deny" pressed={verdict === "contest"} onClick={actions.contest} />
      </div>

      <span className="reader-divider" aria-hidden="true" />
      <ReaderAction label="Close reader" short="" icon={X} onClick={actions.closeWindow} />
    </div>
  );
}

/** The three page arrangements a reader of this era offered. */
function ViewMenu({ view, onChange }: { view: ReaderView; onChange: (next: ReaderView) => void }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="reader-action">
        <LayoutGrid className="reader-action-glyph" aria-hidden="true" />
        <span className="reader-action-label">View</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="circa-menu" align="start" sideOffset={2}>
          <DropdownMenu.Label className="circa-menulabel">Page arrangement</DropdownMenu.Label>
          <DropdownMenu.RadioGroup value={view} onValueChange={(next) => onChange(next as ReaderView)}>
            {READER_VIEWS.map((mode) => (
              <DropdownMenu.RadioItem key={mode} className="circa-menuitem" value={mode}>
                {viewLabel(mode)}
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
          <DropdownMenu.Separator className="circa-menuseparator" />
          {/* Two-up needs a margin wide enough for two columns, and says so rather than folding silently. */}
          <DropdownMenu.Item className="circa-menuitem" disabled title="Two-up folds to one column below 1100 pixels">
            Page size follows the window
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/**
 * How the record is set. The reader's preference, not the record's: the archive
 * types its filings, so Courier is what a document is unless someone reading for
 * a living asks for something easier on the eyes.
 *
 * Size is a set of presets over the same value the toolbar's scale buttons step
 * through, so the current size is printed on the group rather than implied by a
 * checked item that a stepped-to value would not match.
 */
function TextMenu({ font, scale, onFont, onScale }: {
  font: ReaderFont;
  scale: number;
  onFont: (next: ReaderFont) => void;
  onScale: (next: number) => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="reader-action">
        <Type className="reader-action-glyph" aria-hidden="true" />
        <span className="reader-action-label">Text</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="circa-menu" align="start" sideOffset={2}>
          <DropdownMenu.Label className="circa-menulabel">Type size — {formatScale(scale)}</DropdownMenu.Label>
          {DOCUMENT_SIZES.map((size) => (
            <DropdownMenu.Item key={size.scale} className="circa-menuitem" onSelect={() => onScale(size.scale)}>
              {size.label}
              <span className="circa-menuvalue">{formatScale(size.scale)}</span>
            </DropdownMenu.Item>
          ))}
          <DropdownMenu.Separator className="circa-menuseparator" />
          <DropdownMenu.Label className="circa-menulabel">Typeface</DropdownMenu.Label>
          <DropdownMenu.RadioGroup value={font} onValueChange={(next) => onFont(next as ReaderFont)}>
            {READER_FONTS.map((choice) => (
              <DropdownMenu.RadioItem key={choice} className="circa-menuitem" value={choice}>
                {fontLabel(choice)}
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/**
 * One tool. The label is the accessible name and `short` is what the bar
 * prints; an empty `short` leaves a glyph on its own, which is what the tools
 * whose icons already say the word get.
 */
function ReaderAction({ label, short, icon: Icon, pressed, tone, disabled, title, onClick }: {
  label: string;
  short?: string;
  icon: typeof ArrowLeft;
  pressed?: boolean;
  /** Which way a verdict reads, for the two controls that fill on press. */
  tone?: "affirm" | "deny";
  disabled?: boolean;
  title?: string;
  onClick: () => void;
}) {
  const printed = short ?? label;
  return (
    <button type="button" className="reader-action" data-pressed={pressed ? "true" : undefined}
      data-tone={tone}
      aria-label={label} aria-pressed={pressed === undefined ? undefined : pressed}
      disabled={disabled} title={title} onClick={onClick}>
      <Icon className="reader-action-glyph" aria-hidden="true" />
      {printed !== "" && <span className="reader-action-label">{printed}</span>}
    </button>
  );
}

/**
 * The credentials prompt. One line of text and one button, with no form to fill
 * in: the workstation already holds the credential, and the prompt is the
 * institution asking whether this is really the person at the desk.
 */
export function ReaderCredentials({ open, onEnter, onClose }: {
  open: boolean;
  onEnter: () => void;
  onClose: () => void;
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="message-box-backdrop" />
        <AlertDialog.Content className="message-box reader-credentials circa-raised">
          <div className="message-box-titlebar">
            <AlertDialog.Title className="message-box-title">{READER_NAME}</AlertDialog.Title>
          </div>
          <div className="message-box-body">
            <span className="message-box-glyph" aria-hidden="true">
              <FileKey className="message-box-icon" />
            </span>
            <AlertDialog.Description className="message-box-text">
              <span className="message-box-heading">Reviewer session required</span>
              A rating, a note, or a vote is recorded against a name. This terminal holds one reviewer credential.
            </AlertDialog.Description>
          </div>
          <p className="message-box-detail circa-mono">Terminal 4 · clearance level 4</p>
          <div className="message-box-actions">
            <AlertDialog.Action className="reader-enter" onClick={onEnter}>Enter</AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
