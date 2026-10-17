"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { CLASS_LABELS, STATUS_LABELS, type ArchiveStatus } from "../browser/archive-index";
import { ReaderCredentials, ReaderToolbar, type ReaderActions } from "./reader-chrome";
import { followUpsFor } from "./reader-correspondence";
import { FONT_STACKS, READER_MATCH_HIGHLIGHT, SCALE_DEFAULT, clampScale, describeMatches, formatScale, matchRanges, sectionAnchor, stepScale, viewLabel, type ReaderFont, type ReaderSection, type ReaderView } from "./reader-model";
import { AnnotationRail, SectionRail, type RailState } from "./reader-rails";
import { FollowUpStrip } from "./reader-references";
import { isReviewer, sessionNotes, type ReaderSession, type ReaderVerdict } from "./reader-session";
import { recordDocument } from "./record-filings";
import "./reader.css";

/**
 * The record reader: the window that opens when a record is opened.
 *
 * It looks like an off-brand PDF reader of an indeterminate era, and it never
 * renders a PDF. Every reader affordance around the sheet is theatre; the sheet
 * itself is a slot. The frame decides what a record *is* (its identity, its
 * sections, where its margins and its follow-ups go) and the host decides what
 * a record *says*, by handing a renderer to `renderSection`. With no renderer
 * the sheet is a set of named, empty sections, which is what the container is
 * specified to be and what the test suite holds it to.
 *
 * Two consequences of that split are worth stating. Search reads the sheet's
 * own DOM rather than the document model, because the host's renderer is
 * allowed to emit anything; and the match readout is written by that effect
 * rather than by React, because React has no idea what is on the sheet either.
 */

/**
 * The records open in the reader, and where in that list the reader is standing.
 *
 * The trail lives in the shell rather than in the viewer, because the shell is
 * what opens a record in the first place. One owner for "which record is on the
 * screen" means a code arriving from the archive and a code chosen from a
 * follow-up strip take exactly the same path, and the viewer needs no effect to
 * notice that it has been handed something.
 */
export type RecordTrail = { codes: readonly string[]; at: number };

/** The states a section's status earns it. An ordinary filing is not stamped. */
const STATUS_STAMPS: Partial<Record<ArchiveStatus, "stampContested" | "stampSealed" | "stampRestricted" | "stampErased">> = {
  contested: "stampContested",
  sealed: "stampSealed",
  restricted: "stampRestricted",
  erased: "stampErased",
};

const NARROW_QUERY = "(max-width: 1023px)";

function narrowViewport(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(NARROW_QUERY).matches;
}

function subscribeToViewport(onChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const list = window.matchMedia(NARROW_QUERY);
  list.addEventListener?.("change", onChange);
  return () => list.removeEventListener?.("change", onChange);
}

/** Whether the window is too narrow to hold both margins at once. */
function useNarrowViewport(): boolean {
  return useSyncExternalStore(subscribeToViewport, narrowViewport, () => false);
}

/** Where the text runs that the query was found in, so the sheet can paint them. */
function collectMatchRanges(sheet: HTMLElement, query: string): Range[] {
  if (!query.trim()) return [];
  const walker = document.createTreeWalker(sheet, NodeFilter.SHOW_TEXT);
  const ranges: Range[] = [];
  let node = walker.nextNode();
  while (node) {
    for (const found of matchRanges(node.textContent ?? "", query)) {
      const range = document.createRange();
      range.setStart(node, found.start);
      range.setEnd(node, found.end);
      ranges.push(range);
    }
    node = walker.nextNode();
  }
  return ranges;
}

/*
 * Matching is painted with the custom highlight API rather than by wrapping the
 * matches in elements. Wrapping would mean rewriting the host renderer's own
 * output, which is the one thing this frame promised not to do, and it would
 * throw the renderer's bookkeeping away on every keystroke. Where the API is
 * missing the count still reports, and only the paint is skipped.
 */
type HighlightRegistry = { set: (name: string, value: object) => void; delete: (name: string) => void };
type HighlightConstructor = new (...ranges: Range[]) => object;
type HighlightGlobals = { CSS?: { highlights?: HighlightRegistry }; Highlight?: HighlightConstructor };

function highlightRegistry(): HighlightRegistry | undefined {
  return (globalThis as unknown as HighlightGlobals).CSS?.highlights;
}

function paintMatches(ranges: readonly Range[]): void {
  const registry = highlightRegistry();
  const Constructor = (globalThis as unknown as HighlightGlobals).Highlight;
  if (!registry) return;
  if (ranges.length === 0 || typeof Constructor !== "function") {
    registry.delete(READER_MATCH_HIGHLIGHT);
    return;
  }
  registry.set(READER_MATCH_HIGHLIGHT, new Constructor(...ranges));
}

export function RecordReader({ trail, session, onOpenRecord, onTravel, onCloseWindow, renderSection }: {
  /** The records open in the viewer and the one on the screen. */
  trail: RecordTrail;
  session: ReaderSession;
  onOpenRecord: (code: string) => void;
  onTravel: (delta: 1 | -1) => void;
  onCloseWindow: () => void;
  /** The body slot. Omitted, every section renders empty. */
  renderSection?: (section: ReaderSection) => ReactNode;
}) {
  const [view, setView] = useState<ReaderView>("continuous");
  const [scale, setScale] = useState(SCALE_DEFAULT);
  // How the reader likes to be read to, which is theirs and not the record's.
  const [font, setFont] = useState<ReaderFont>("courier");
  const [fit, setFit] = useState(false);
  const [leftRail, setLeftRail] = useState<RailState>("auto");
  const [rightRail, setRightRail] = useState<RailState>("auto");
  // Both of these name the record they belong to, so moving to another record
  // simply stops matching one instead of needing to be cleaned up.
  const [selected, setSelected] = useState<{ code: string; sectionId: string } | null>(null);
  const [reply, setReply] = useState<{ code: string; noteId: string } | null>(null);
  const [followUpsCollapsed, setFollowUpsCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<{ code: string | null; text: string } | null>(null);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const matchRef = useRef<HTMLSpanElement | null>(null);
  const narrow = useNarrowViewport();
  const t = useTranslations("reader");

  const code = trail.codes[trail.at] ?? null;
  const record = useMemo(() => (code ? recordDocument(code) : undefined), [code]);
  const sections = useMemo(() => record?.sections ?? [], [record]);
  const active = selected && selected.code === code && sections.some((section) => section.id === selected.sectionId)
    ? selected.sectionId
    : sections[0]?.id ?? null;
  const replyTo = reply && reply.code === code ? reply.noteId : null;
  const notes = useMemo(() => sessionNotes(session, code ?? "", sections), [session, code, sections]);
  const followUps = useMemo(() => (code ? followUpsFor(code) : { inbound: [], outbound: [] }), [code]);

  /*
   * The only thing that can see what is on the sheet is the sheet. The host's
   * renderer is allowed to emit anything it likes, so matches are found by
   * walking the rendered DOM rather than the document model, and the count is
   * written straight into its own node: React never holds it, because React
   * does not know it either.
   */
  useEffect(() => {
    const sheet = sheetRef.current;
    const ranges = sheet ? collectMatchRanges(sheet, query) : [];
    if (matchRef.current) matchRef.current.textContent = describeMatches(ranges.length, query, t);
    paintMatches(ranges);
  }, [query, code, view, t]);

  function selectSection(id: string) {
    setSelected({ code: code ?? "", sectionId: id });
    const node = sheetRef.current?.querySelector<HTMLElement>(`#${sectionAnchor(id)}`);
    // The sheet's own styles decide whether that movement is smooth, so a
    // reader who has asked for less motion gets none of it.
    node?.scrollIntoView?.({ block: "start" });
  }

  function onSheetScroll() {
    if (view !== "continuous") return;
    const sheet = sheetRef.current;
    if (!sheet) return;
    const top = sheet.scrollTop + 32;
    let found = active;
    for (const section of sections) {
      const node = sheet.querySelector<HTMLElement>(`#${sectionAnchor(section.id)}`);
      if (node && node.offsetTop <= top) found = section.id;
    }
    if (found !== active) setSelected({ code: code ?? "", sectionId: found ?? "" });
  }

  /** Anything a guest may not do is asked for once, and then done. */
  function gate(act: () => void) {
    if (isReviewer(session)) {
      act();
      return;
    }
    setPending(() => act);
    setCredentialsOpen(true);
  }

  const actions: ReaderActions = {
    back: () => onTravel(-1),
    forward: () => onTravel(1),
    setView,
    zoomOut: () => setScale((current) => stepScale(current, -1)),
    zoomIn: () => setScale((current) => stepScale(current, 1)),
    resetScale: () => setScale(SCALE_DEFAULT),
    setScale: (next) => setScale(clampScale(next)),
    setFont,
    toggleFit: () => setFit((current) => !current),
    toggleSearch: () => setSearchOpen((current) => !current),
    comment: () => {
      setRightRail("open");
      composerRef.current?.focus();
    },
    assess: (value) => gate(() => session.assess(code ?? "", value)),
    corroborate: () => gate(() => session.verdict(code ?? "", "corroborate" as ReaderVerdict)),
    contest: () => gate(() => session.verdict(code ?? "", "contest" as ReaderVerdict)),
    // Rotate, Print, and Download land here and stop.
    inert: () => {},
    closeWindow: onCloseWindow,
  };

  function verifyAndAct() {
    session.signIn();
    const act = pending;
    setPending(null);
    act?.();
  }

  function fileNote() {
    if (!draft.trim() || !code) return;
    const section = active ?? sections[0]?.id;
    if (!section) return;
    gate(() => {
      session.fileNote(code, section, draft, replyTo ?? undefined);
      setDraft("");
      setReply(null);
      setNotice({ code, text: t("statusNoteFiled", { code: record?.code ?? code }) });
    });
  }

  const total = followUps.inbound.length + followUps.outbound.length;
  const stampKey = record ? STATUS_STAMPS[record.status] : undefined;
  const status = notice && notice.code === code
    ? notice.text
    : !code
      ? t("statusNoRecord")
      : record
        ? t("statusOpened", { code: record.code, sections: record.sections.length, annotations: notes.length })
        : t("statusNotIndexed", { code });
  const shown = view === "single" ? sections.filter((section) => section.id === active) : sections;

  return (
    <div className="reader">
      <ReaderToolbar code={code} view={view} scale={scale} font={font} fit={fit} matchRef={matchRef}
        canGoBack={trail.at > 0} canGoForward={trail.at < trail.codes.length - 1}
        assessment={code ? session.assessments[code] : undefined}
        verdict={code ? session.verdicts[code] ?? null : null}
        searchOpen={searchOpen} query={query} onQueryChange={setQuery} actions={actions} />

      <div className="reader-main">
        <SectionRail sections={sections} activeId={active} rail={leftRail} collapsed={leftRail === "auto" ? narrow : leftRail === "closed"}
          onSelect={selectSection} onToggle={() => setLeftRail(leftRail === "closed" || (leftRail === "auto" && narrow) ? "open" : "closed")} />

        <div className="reader-sheetwrap">
          <div className="reader-sheet" id="reader-content" data-testid="reader-sheet" ref={sheetRef}
            data-view={view} data-fit={fit ? "margin" : "measured"} data-font={font} tabIndex={0}
            style={{ "--reader-scale": String(scale / 100), "--reader-document-font": FONT_STACKS[font] } as CSSProperties}
            onScroll={onSheetScroll}>
            {/* Everything on the sheet shares one measure, set here rather than
                on each child: `ch` resolves against the font of the element that
                uses it, so a heading set smaller would otherwise measure itself
                into a narrower column than the prose it belongs to. */}
            <div className="reader-measure">
              {record ? (
                <>
                  {/* The running head: whose filing this is, on every sheet of it. */}
                  <p className="reader-running-head">
                    <span>{record.organization}</span>
                    <span>{record.code}</span>
                  </p>

                  <header className="reader-leaf">
                    <div className="reader-leaf-text">
                      <p className="reader-leaf-code circa-mono">{record.code}</p>
                      <h1 className="reader-leaf-title">
                        {record.designation ?? <span className="reader-redaction" role="img" aria-label={t("designationWithheld")} />}
                      </h1>
                      <p className="reader-leaf-line">
                        <span>{CLASS_LABELS[record.klass]}</span>
                        <span className="reader-leaf-sep" aria-hidden="true" />
                        <span className="circa-mono">{t("filedOn", { date: record.filed })}</span>
                        <span className="reader-leaf-sep" aria-hidden="true" />
                        <span>{STATUS_LABELS[record.status]}</span>
                        <span className="reader-leaf-sep" aria-hidden="true" />
                        <span className="circa-mono">{record.organization}</span>
                        <span className="reader-leaf-sep" aria-hidden="true" />
                        <span>{record.clearance}</span>
                      </p>
                    </div>
                    {stampKey && (
                      // The status is on the stamp as data, so the sheet can give a state
                      // its own treatment without the frame styling it here.
                      <span className="reader-stamp" data-status={record.status}>{t(stampKey)}</span>
                    )}
                  </header>

                  <div className="reader-sections">
                    {shown.map((section) => (
                      <section className="reader-section" key={section.id} id={sectionAnchor(section.id)}
                        aria-label={section.heading}
                        data-active={section.id === active ? "true" : undefined}
                        data-withheld={section.withheld ? "true" : undefined}>
                        {/* The slot. The frame renders nothing here but the host's bytes. */}
                        {renderSection?.(section)}
                      </section>
                    ))}
                  </div>

                  {/* The running foot: the same lens, with what the sheet is and who may read it. */}
                  <p className="reader-running-foot">
                    <span>{record.organization}</span>
                    <span>{CLASS_LABELS[record.klass]} · {record.clearance}</span>
                  </p>

                  <p className="reader-fixture">
                    {t("fixture")}{t("fixtureNote")}
                  </p>
                </>
              ) : (
                <div className="reader-empty">
                  <h1 className="reader-empty-title">{code ? t("noEntry") : t("noRecordOpen")}</h1>
                  {code && <p className="reader-empty-code circa-mono">{code}</p>}
                  <p className="reader-empty-note">
                    {code ? t("noEntryNote") : t("noRecordNote")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <AnnotationRail notes={notes} sections={sections} activeHeading={sections.find((section) => section.id === active)?.heading ?? null}
          rail={rightRail} collapsed={rightRail === "auto" ? narrow : rightRail === "closed"}
          draft={draft} replyTo={replyTo} composerRef={composerRef}
          onDraftChange={setDraft} onReply={(noteId) => setReply(noteId ? { code: code ?? "", noteId } : null)}
          onFile={fileNote} onEndorse={(id) => gate(() => session.endorse(id))}
          onToggle={() => setRightRail(rightRail === "closed" || (rightRail === "auto" && narrow) ? "open" : "closed")} />
      </div>

      <FollowUpStrip code={code} inbound={followUps.inbound} outbound={followUps.outbound}
        collapsed={followUpsCollapsed} onToggle={() => setFollowUpsCollapsed((current) => !current)} onOpen={onOpenRecord} />

      <div className="reader-statusbar">
        <span className="reader-status-text" role="status">{status}</span>
        <span className="reader-status-cell circa-mono">{formatScale(scale)}</span>
        <span className="reader-status-cell">{viewLabel(view, t)}</span>
        <span className="reader-status-cell circa-mono">{t("followUpCount", { count: total })}</span>
        <span className="reader-status-cell reader-status-fixture">{t("fixture")}</span>
      </div>

      <ReaderCredentials open={credentialsOpen} onEnter={verifyAndAct}
        onClose={() => { setCredentialsOpen(false); setPending(null); }} />
    </div>
  );
}
