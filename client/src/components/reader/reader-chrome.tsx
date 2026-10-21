"use client";

import { AlertDialog, Menubar } from "radix-ui";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  FileKey,
  MessageSquare,
  MoveHorizontal,
  Printer,
  RotateCw,
  TextSearch,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useId, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { READER_NAME } from "./reader-identity";
import {
  ASSESSMENT_SCALE,
  DOCUMENT_SIZES,
  READER_FONTS,
  READER_VIEWS,
  assessmentLabel,
  fontLabel,
  formatScale,
  scaleLimit,
  viewLabel,
  type ReaderFont,
  type ReaderView,
} from "./reader-model";
import type { ReaderVerdict } from "./reader-session";
import "../ui/menubar.css";

/**
 * The reader's furniture: the menu bar and toolbar across the top, and the
 * credentials prompt the engagement controls raise.
 *
 * The shape is the workstation's own, and it was not at first. Every other
 * application in this shell is a menu bar of worded commands over a toolbar of
 * raised plates, and a window that skipped the menu bar and drew its tools as
 * flat ghost tiles read as software from a later decade bolted into this one.
 * A reader of this era had the same two rows as its neighbours, so it has them:
 * File, View, Text, and Go above, and the document's own controls below.
 *
 * The bar beneath is two zones, which is the split that matters. On the left are
 * the things you do to a document: where in the trail you are, how it is set,
 * and the four reader affordances. On the right are the things you do *about* a
 * document, which is bureaucracy rather than machinery, and it is drawn as such:
 * a worded assessment scale in its own sunken well, and a corroboration and a
 * contest as plates beside it.
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

export function ReaderToolbar({
  code,
  view,
  scale,
  font,
  fit,
  matchRef,
  canGoBack,
  canGoForward,
  assessment,
  verdict,
  searchOpen,
  query,
  onQueryChange,
  actions,
}: {
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
  const t = useTranslations("reader");
  return (
    <>
      <ReaderMenu
        view={view}
        scale={scale}
        font={font}
        fit={fit}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        actions={actions}
      />

      <div
        className="reader-toolbar"
        role="toolbar"
        aria-label={t("toolbarLabel")}
      >
        <div className="reader-toolgroup">
          <ReaderAction
            label={t("previousRecord")}
            short={t("backShort")}
            icon={ArrowLeft}
            disabled={!canGoBack}
            title={canGoBack ? undefined : t("firstRecordTitle")}
            onClick={actions.back}
          />
          <ReaderAction
            label={t("nextRecord")}
            short={t("aheadShort")}
            icon={ArrowRight}
            disabled={!canGoForward}
            title={canGoForward ? undefined : t("noRecordAheadTitle")}
            onClick={actions.forward}
          />
        </div>

        <span className="reader-divider" aria-hidden="true" />

        {/* How the sheet is set: the same cluster the word processor's format bar owns. */}
        <div className="reader-toolgroup">
          <span className="reader-legend circa-label">{t("sizeLegend")}</span>
          <ReaderAction
            label={t("scaleDown")}
            short=""
            icon={ZoomOut}
            disabled={scaleLimit(scale, -1)}
            title={t("scaleMinTitle")}
            onClick={actions.zoomOut}
          />
          <button
            type="button"
            className="reader-scale circa-sunken"
            title={t("resetScaleTitle")}
            onClick={actions.resetScale}
          >
            {/* The one flicker on open: a single frame of a scale that is not set. */}
            <span className="reader-scale-blip" aria-hidden="true">
              102%
            </span>
            <span className="reader-scale-value">{formatScale(scale)}</span>
          </button>
          <ReaderAction
            label={t("scaleUp")}
            short=""
            icon={ZoomIn}
            disabled={scaleLimit(scale, 1)}
            title={t("scaleMaxTitle")}
            onClick={actions.zoomIn}
          />
          <ReaderAction
            label={t("fitToMargin")}
            short={t("fitShort")}
            icon={MoveHorizontal}
            pressed={fit}
            onClick={actions.toggleFit}
          />
        </div>

        <span className="reader-divider" aria-hidden="true" />

        <div className="reader-toolgroup">
          <ReaderAction
            label={t("rotate")}
            short=""
            icon={RotateCw}
            onClick={actions.inert}
          />
          <ReaderAction
            label={t("print")}
            short=""
            icon={Printer}
            onClick={actions.inert}
          />
          <ReaderAction
            label={t("download")}
            short=""
            icon={Download}
            title={t("downloadTitle")}
            onClick={actions.inert}
          />
        </div>

        <span className="reader-divider" aria-hidden="true" />

        <div className="reader-toolgroup">
          <ReaderAction
            label={t("search")}
            short=""
            icon={TextSearch}
            pressed={searchOpen}
            onClick={actions.toggleSearch}
          />
          {searchOpen && (
            <span className="reader-search circa-sunken">
              <input
                className="reader-search-input"
                type="search"
                aria-label={t("searchThisRecord")}
                spellCheck={false}
                autoComplete="off"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
              />
            </span>
          )}
          {/*
            The match readout is written by the viewer's own search effect rather
            than by React, because the only thing that knows what is on the sheet
            is the sheet, and the renderer mounted in the slot is not ours.
          */}
          <span
            className="reader-match-count circa-mono"
            data-testid="reader-match-count"
            ref={matchRef}
            aria-live="polite"
          />
        </div>

        <span className="reader-toolbar-spacer" />

        <div className="reader-toolgroup reader-engagement">
          {/*
            Quality, not agreement. The scale is a set of ruled grades in a sunken
            well, which is what a form's rating field looked like; the two votes
            are plates outside it. Neither can be read as the other.
          */}
          <div
            className="reader-assessment"
            role="radiogroup"
            aria-labelledby={assessmentLabelId}
          >
            <span
              className="reader-assessment-label circa-label"
              id={assessmentLabelId}
            >
              {t("assessment")}
            </span>
            <span className="reader-assessment-well circa-sunken">
              <span className="reader-points">
                {ASSESSMENT_SCALE.map((label, value) => (
                  // The blocks fill up to the grade reached, so the row reads as one
                  // scale rather than as five unrelated buttons. The dash is the
                  // absence of a judgement, so it is never part of the fill.
                  <label
                    className="reader-point"
                    key={label}
                    data-checked={assessment === value ? "true" : undefined}
                    data-lit={
                      value > 0 &&
                      assessment !== undefined &&
                      value <= assessment
                        ? "true"
                        : undefined
                    }
                  >
                    {/* A real radio, so the scale keeps its arrow keys and its roving tab stop. */}
                    <input
                      className="reader-point-input"
                      type="radio"
                      name={`reader-assessment-${code ?? "none"}`}
                      value={value}
                      checked={assessment === value}
                      onChange={() => actions.assess(value)}
                    />
                    <span className="reader-point-word">
                      {assessmentLabel(label, t)}
                    </span>
                  </label>
                ))}
              </span>
              <span
                className="reader-assessment-score circa-mono"
                data-testid="reader-assessment-score"
              >
                {assessment ?? 0}/5
              </span>
            </span>
          </div>
          <ReaderAction
            label={t("comment")}
            short=""
            icon={MessageSquare}
            onClick={actions.comment}
          />
          <ReaderAction
            label={t("corroborate")}
            icon={Check}
            tone="affirm"
            pressed={verdict === "corroborate"}
            onClick={actions.corroborate}
          />
          <ReaderAction
            label={t("contest")}
            icon={X}
            tone="deny"
            pressed={verdict === "contest"}
            onClick={actions.contest}
          />
        </div>

        <span className="reader-divider" aria-hidden="true" />
        <ReaderAction
          label={t("closeReader")}
          short=""
          icon={X}
          onClick={actions.closeWindow}
        />
      </div>
    </>
  );
}

/**
 * The commands, on the row every other window in this shell puts them on.
 *
 * Four menus rather than four toolbar buttons, because that is the difference
 * between an application of this era and a modern one with a dropdown in its
 * toolbar. Nothing moved out of reach: File is the way out of the window, View
 * is the page arrangement and the margin, Text is the type, and Go is the trail
 * the two arrows at the far left also walk. A fifth menu would be a menu that
 * cannot act, which this shell does not ship.
 */
function ReaderMenu({
  view,
  scale,
  font,
  fit,
  canGoBack,
  canGoForward,
  actions,
}: {
  view: ReaderView;
  scale: number;
  font: ReaderFont;
  fit: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  actions: ReaderActions;
}) {
  const t = useTranslations("reader");
  return (
    <Menubar.Root className="circa-menubar" aria-label={t("menubarLabel")}>
      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle">
          {t("menuFile")}
        </Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className="circa-menu" align="start" sideOffset={0}>
            <Menubar.Item
              className="circa-menuitem"
              onSelect={actions.closeWindow}
            >
              {t("closeReader")}
              <span className="circa-menukey">Esc</span>
            </Menubar.Item>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle">
          {t("view")}
        </Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className="circa-menu" align="start" sideOffset={0}>
            <Menubar.Label className="circa-menulabel">
              {t("pageArrangement")}
            </Menubar.Label>
            <Menubar.RadioGroup
              value={view}
              onValueChange={(next) => actions.setView(next as ReaderView)}
            >
              {READER_VIEWS.map((mode) => (
                <Menubar.RadioItem
                  key={mode}
                  className="circa-menuitem"
                  value={mode}
                >
                  {viewLabel(mode, t)}
                </Menubar.RadioItem>
              ))}
            </Menubar.RadioGroup>
            <Menubar.Separator className="circa-menuseparator" />
            {/* The measure is a state, so it is a tick rather than a command. */}
            <Menubar.CheckboxItem
              className="circa-menuitem"
              checked={fit}
              onSelect={actions.toggleFit}
            >
              {t("fitToMargin")}
            </Menubar.CheckboxItem>
            <Menubar.Separator className="circa-menuseparator" />
            {/* Two-up needs a margin wide enough for two columns, and says so rather than folding silently. */}
            <Menubar.Item
              className="circa-menuitem"
              disabled
              title={t("twoUpTitle")}
            >
              {t("pageSizeFollows")}
            </Menubar.Item>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle">
          {t("text")}
        </Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className="circa-menu" align="start" sideOffset={0}>
            <Menubar.Label className="circa-menulabel">
              {t("typeSize", { scale: formatScale(scale) })}
            </Menubar.Label>
            {DOCUMENT_SIZES.map((size) => (
              <Menubar.Item
                key={size.scale}
                className="circa-menuitem"
                onSelect={() => actions.setScale(size.scale)}
              >
                {t(size.key)}
                <span className="circa-menuvalue">
                  {formatScale(size.scale)}
                </span>
              </Menubar.Item>
            ))}
            <Menubar.Separator className="circa-menuseparator" />
            <Menubar.Label className="circa-menulabel">
              {t("typeface")}
            </Menubar.Label>
            <Menubar.RadioGroup
              value={font}
              onValueChange={(next) => actions.setFont(next as ReaderFont)}
            >
              {READER_FONTS.map((choice) => (
                <Menubar.RadioItem
                  key={choice}
                  className="circa-menuitem"
                  value={choice}
                >
                  {fontLabel(choice, t)}
                </Menubar.RadioItem>
              ))}
            </Menubar.RadioGroup>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle">
          {t("menuGo")}
        </Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className="circa-menu" align="start" sideOffset={0}>
            <Menubar.Item
              className="circa-menuitem"
              disabled={!canGoBack}
              onSelect={actions.back}
            >
              {t("previousRecord")}
            </Menubar.Item>
            <Menubar.Item
              className="circa-menuitem"
              disabled={!canGoForward}
              onSelect={actions.forward}
            >
              {t("nextRecord")}
            </Menubar.Item>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>
    </Menubar.Root>
  );
}

/**
 * One tool: a raised plate, which is what every other window in this shell puts
 * its controls on. The label is the accessible name and `short` is what the
 * plate prints; an empty `short` leaves the glyph to speak, which is what the
 * tools whose icons already say the word get.
 */
function ReaderAction({
  label,
  short,
  icon: Icon,
  pressed,
  tone,
  disabled,
  title,
  onClick,
}: {
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
    <button
      type="button"
      className="reader-action"
      data-pressed={pressed ? "true" : undefined}
      data-tone={tone}
      data-glyph-only={printed === "" ? "true" : undefined}
      aria-label={label}
      aria-pressed={pressed === undefined ? undefined : pressed}
      disabled={disabled}
      title={title}
      onClick={onClick}
    >
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
export function ReaderCredentials({
  open,
  onEnter,
  onClose,
}: {
  open: boolean;
  onEnter: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("reader");
  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="message-box-backdrop" />
        <AlertDialog.Content className="message-box reader-credentials circa-raised">
          <div className="message-box-titlebar">
            <AlertDialog.Title className="message-box-title">
              {READER_NAME}
            </AlertDialog.Title>
          </div>
          <div className="message-box-body">
            <span className="message-box-glyph" aria-hidden="true">
              <FileKey className="message-box-icon" />
            </span>
            <AlertDialog.Description className="message-box-text">
              <span className="message-box-heading">
                {t("credentialsHeading")}
              </span>
              {t("credentialsBody")}
            </AlertDialog.Description>
          </div>
          <p className="message-box-detail circa-mono">
            {t("credentialsDetail")}
          </p>
          <div className="message-box-actions">
            <AlertDialog.Action className="reader-enter" onClick={onEnter}>
              {t("enter")}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
