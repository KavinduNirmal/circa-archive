"use client";

import { useState } from "react";
import {
  ARCHIVE_ADDRESS,
  ARCHIVE_INDEX,
  CLASS_LABELS,
  PERIOD_LABELS,
  searchArchive,
  type ArchiveClass,
  type ArchiveQuery,
} from "./archive-index";
import { ArchivePage, type ArchiveDocument, type ArchiveTextSize } from "./archive-page";
import { BrowserMenu, BrowserStatus, BrowserTabs, BrowserToolbar, type BrowserActions } from "./browser-chrome";
import { BrowserNotice, type BrowserNoticeKind } from "./browser-notice";
import "./browser.css";

const EMPTY_QUERY: ArchiveQuery = { text: "", klass: "all", period: "any" };

/** The form mirrors the document, so a document is the only place a query lives. */
function draftFor(document: ArchiveDocument): ArchiveQuery {
  return document.kind === "results" ? document.query : EMPTY_QUERY;
}

function describe(document: ArchiveDocument): string {
  return document.kind === "home" ? "the index" : "the result list";
}

/**
 * The archive browser, hosted by the Search destination.
 *
 * One tab is always open and cannot be closed, so this is a small document
 * stack rather than a tab manager: `history` plus a `cursor` gives Back and
 * Forward real work to do, and every navigation mirrors the resulting document
 * into the search form. Nothing here reaches outside the terminal, which is the
 * point of the fiction: the model is that the local network permits exactly one
 * document, and every other browser affordance is refused with a reason.
 *
 * A record is the one thing this window does not open. A code is handed to the
 * reader, which is the screen built for reading one, and the index stays where
 * it was so Back is still the way to the list you found the code on.
 */
export function ArchiveBrowser({ onCloseWindow, onOpenRecord }: {
  onCloseWindow: () => void;
  onOpenRecord: (code: string) => void;
}) {
  const [history, setHistory] = useState<ArchiveDocument[]>([{ kind: "home" }]);
  const [cursor, setCursor] = useState(0);
  const [draft, setDraft] = useState<ArchiveQuery>(EMPTY_QUERY);
  const [address, setAddress] = useState(ARCHIVE_ADDRESS);
  const [textSize, setTextSize] = useState<ArchiveTextSize>("normal");
  const [notice, setNotice] = useState<BrowserNoticeKind | null>(null);
  const [visited, setVisited] = useState<readonly string[]>([]);
  const [status, setStatus] = useState(`Ready. ${ARCHIVE_INDEX.length} entries indexed.`);

  const document = history[cursor];
  const results = document.kind === "results" ? searchArchive(document.query) : [];
  const canGoBack = cursor > 0;
  const canGoForward = cursor < history.length - 1;
  /** Pushes a document, which is what every deliberate navigation does. */
  function go(next: ArchiveDocument) {
    setHistory((current) => [...current.slice(0, cursor + 1), next]);
    setCursor(cursor + 1);
    setDraft(draftFor(next));
  }

  function travel(delta: number) {
    const target = cursor + delta;
    if (target < 0 || target >= history.length) return;
    setCursor(target);
    setDraft(draftFor(history[target]));
    setStatus(`${delta < 0 ? "Back to" : "Forward to"} ${describe(history[target])}.`);
  }

  function report(query: ArchiveQuery) {
    const matched = searchArchive(query);
    const scope = [
      query.text.trim() ? `term "${query.text.trim()}"` : "whole index",
      query.klass === "all" ? "all classes" : CLASS_LABELS[query.klass],
      PERIOD_LABELS[query.period],
    ].join(" · ");
    setStatus(`${matched.length} of ${ARCHIVE_INDEX.length} entries match · ${scope}`);
  }

  function runSearch() {
    const query: ArchiveQuery = { ...draft };
    go({ kind: "results", query });
    report(query);
  }

  function openIndexLink(klass: ArchiveClass) {
    // A section link always lists its whole class, so a leftover period filter
    // cannot quietly hide most of the section it just promised.
    const query: ArchiveQuery = { text: "", klass, period: "any" };
    go({ kind: "results", query });
    report(query);
  }

  function widenPeriod() {
    if (document.kind !== "results") return;
    const query: ArchiveQuery = { ...document.query, period: "any" };
    go({ kind: "results", query });
    report(query);
  }

  /** Hands the code to the reader and stays where it is, so the index is not lost. */
  function handOff(code: string) {
    onOpenRecord(code);
    setVisited((current) => (current.includes(code) ? current : [...current, code]));
    setStatus(`Opened ${code} in the reader.`);
  }

  function openHome() {
    go({ kind: "home" });
    setStatus(`Archive home. ${ARCHIVE_INDEX.length} entries indexed.`);
  }

  function clearAll() {
    setDraft(EMPTY_QUERY);
    go({ kind: "home" });
    setStatus(`Filters cleared. ${ARCHIVE_INDEX.length} entries indexed.`);
  }

  function refresh() {
    if (document.kind === "home") setStatus("Archive index reloaded.");
    else setStatus("Search reloaded. The result set is unchanged.");
  }

  function attemptNewTab() {
    setNotice("tab");
    setStatus("New tab refused: not permitted on the local network.");
  }

  function submitAddress() {
    if (address.trim() === ARCHIVE_ADDRESS) {
      refresh();
      return;
    }
    setNotice("navigation");
    setAddress(ARCHIVE_ADDRESS);
    setStatus("Navigation refused: no other host is permitted on the local network.");
  }

  const actions: BrowserActions = {
    back: () => travel(-1),
    forward: () => travel(1),
    home: openHome,
    refresh,
    newTab: attemptNewTab,
    about: () => setNotice("about"),
    policy: () => setNotice("policy"),
    closeWindow: onCloseWindow,
  };

  return (
    <div className="browser">
      <BrowserMenu textSize={textSize} onTextSizeChange={setTextSize}
        canGoBack={canGoBack} canGoForward={canGoForward} actions={actions} />
      <BrowserToolbar address={address} onAddressChange={setAddress} onAddressSubmit={submitAddress}
        canGoBack={canGoBack} canGoForward={canGoForward} actions={actions} />
      <BrowserTabs onOpenHome={openHome} onNewTab={attemptNewTab} />
      <div className="browser-page" id="browser-page" role="tabpanel" aria-labelledby="browser-tab-archive">
        <ArchivePage document={document} draft={draft} results={results} visited={visited} textSize={textSize}
          onDraftChange={setDraft} onSearch={runSearch} onClear={clearAll} onOpenRecord={handOff}
          onIndexLink={openIndexLink} onWidenPeriod={widenPeriod} />
      </div>
      <BrowserStatus status={status} />
      <BrowserNotice kind={notice} attempted={address} onClose={() => setNotice(null)} />
    </div>
  );
}
