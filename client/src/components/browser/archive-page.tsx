"use client";

import { Fragment } from "react";
import {
  ARCHIVE_CLASSES,
  ARCHIVE_INDEX,
  ARCHIVE_PERIODS,
  CLASS_LABELS,
  PERIOD_LABELS,
  STATUS_LABELS,
  countClass,
  describeQuery,
  recentFilings,
  type ArchiveClass,
  type ArchiveEntry,
  type ArchivePeriod,
  type ArchiveQuery,
} from "./archive-index";

/** Which document the single tab is currently showing. */
export type ArchiveDocument =
  | { kind: "home" }
  | { kind: "results"; query: ArchiveQuery }
  | { kind: "record"; code: string };

export type ArchiveTextSize = "small" | "normal" | "large";

export const TEXT_SIZE_LABELS: Record<ArchiveTextSize, string> = {
  small: "Small",
  normal: "Normal",
  large: "Large",
};

/** The desktop emblem reused as the archive's masthead seal. */
export const ARCHIVE_SEAL = "/Government_agency_emblem_seal_de…_2K_20261014194612.jpg";

export type ArchivePageProps = {
  document: ArchiveDocument;
  /** Live form state. The browser mirrors it from the document on every navigation. */
  draft: ArchiveQuery;
  /** Entries matching the current results document, already resolved by the browser. */
  results: readonly ArchiveEntry[];
  /** Codes opened in this session, so the page can show the browser's visited state. */
  visited: readonly string[];
  textSize: ArchiveTextSize;
  onDraftChange: (next: ArchiveQuery) => void;
  onSearch: () => void;
  onClear: () => void;
  onOpenRecord: (code: string) => void;
  onIndexLink: (klass: ArchiveClass) => void;
  onWidenPeriod: () => void;
  onReturn: () => void;
  /** Where Back goes from a record, so the button names the document it returns to. */
  returnLabel: string;
};

/**
 * The intranet page the browser displays.
 *
 * Chrome belongs to the browser; everything inside the page frame is the
 * archive's own document, written the way a 1999 internal index was written: a
 * masthead, a rule, a search block, and a bordered table. It keeps the
 * workstation's palette and square corners but switches to the paper surface,
 * so the browser reads as a frame around someone else's document rather than
 * one more steel panel.
 */
export function ArchivePage(props: ArchivePageProps) {
  const { document, draft, results, visited, textSize, onDraftChange, onSearch, onClear, onOpenRecord, onIndexLink, onWidenPeriod, onReturn, returnLabel } = props;

  return (
    <div className="archive-page" data-testid="archive-page" data-text-size={textSize}>
      <header className="archive-masthead">
        <div className="archive-masthead-id">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="archive-seal" src={ARCHIVE_SEAL} alt="" width={56} height={56} />
          <div className="archive-masthead-text">
            <p className="archive-kicker">CIRCA internal network</p>
            <p className="archive-title">Internal Archive</p>
            <p className="archive-subtitle">Commission for Incident Review and Corrective Action</p>
          </div>
        </div>
        <p className="archive-clearance">Level 4 clearance</p>
      </header>

      <nav className="archive-sections" aria-label="Archive sections">
        <button type="button" className="archive-tablink"
          aria-current={document.kind === "home" ? "page" : undefined} onClick={onClear}>
          Index
        </button>
        {ARCHIVE_CLASSES.map((klass) => (
          <Fragment key={klass}>
            <span className="archive-separator" aria-hidden="true">|</span>
            <button type="button" className="archive-tablink"
              aria-current={document.kind === "results" && document.query.klass === klass ? "true" : undefined}
              onClick={() => onIndexLink(klass)}>
              {CLASS_LABELS[klass]} index ({countClass(klass)})
            </button>
          </Fragment>
        ))}
      </nav>

      <SearchForm variant={document.kind === "home" ? "primary" : "compact"}
        draft={draft} onDraftChange={onDraftChange} onSearch={onSearch} onClear={onClear} />

      {document.kind === "home" && <IndexBody visited={visited} onOpenRecord={onOpenRecord} />}
      {document.kind === "results" && (results.length > 0
        ? <ResultsBody query={document.query} results={results} visited={visited} onOpenRecord={onOpenRecord} />
        : <NoMatchBody query={document.query} onWidenPeriod={onWidenPeriod} onClear={onClear} />)}
      {document.kind === "record" && <RecordBody code={document.code} onReturn={onReturn} returnLabel={returnLabel} />}

      <footer className="archive-footer">
        <p>Internal index. Not for public networks. Filing is a Level 3 infraction.</p>
        <p className="circa-mono">Index rebuilt 2003-03-04</p>
        {/* The preview's honesty marker: these entries are fixture content, not canon. */}
        <p className="archive-fixture">Preview index: codes, designations, and dates are illustrative sample data.</p>
      </footer>
    </div>
  );
}

/**
 * The same three fields in two weights. On the index the search block is the
 * page's job; on a result or a record it is secondary, so `data-variant` lets
 * CSS fold it into one row without hiding a label or splitting the markup.
 */
function SearchForm({ variant, draft, onDraftChange, onSearch, onClear }: {
  variant: "primary" | "compact";
  draft: ArchiveQuery;
  onDraftChange: (next: ArchiveQuery) => void;
  onSearch: () => void;
  onClear: () => void;
}) {
  return (
    <form className="archive-search" role="search" aria-label="Archive search" data-variant={variant}
      onSubmit={(event) => { event.preventDefault(); onSearch(); }}>
      <fieldset className="archive-fieldset">
        <legend className="archive-legend">Search the archive</legend>
        <div className="archive-fields">
          <div className="archive-field archive-field-query">
            <label htmlFor="archive-query">Search records</label>
            <input id="archive-query" className="archive-input circa-mono" type="text" autoComplete="off"
              spellCheck={false} placeholder="INC-00014 or a designation"
              value={draft.text} onChange={(event) => onDraftChange({ ...draft, text: event.target.value })} />
          </div>
          <div className="archive-field">
            <label htmlFor="archive-class">Class</label>
            <select id="archive-class" className="archive-select" value={draft.klass}
              onChange={(event) => onDraftChange({ ...draft, klass: event.target.value as ArchiveClass | "all" })}>
              <option value="all">All classes</option>
              {ARCHIVE_CLASSES.map((klass) => <option key={klass} value={klass}>{CLASS_LABELS[klass]}</option>)}
            </select>
          </div>
          <div className="archive-field">
            <label htmlFor="archive-period">Filed</label>
            <select id="archive-period" className="archive-select" value={draft.period}
              onChange={(event) => onDraftChange({ ...draft, period: event.target.value as ArchivePeriod })}>
              {ARCHIVE_PERIODS.map((period) => <option key={period} value={period}>{PERIOD_LABELS[period]}</option>)}
            </select>
          </div>
          <div className="archive-actions">
            <button type="submit" className="archive-button">Search archive</button>
            <button type="button" className="archive-button" onClick={onClear}>Clear</button>
          </div>
        </div>
      </fieldset>
    </form>
  );
}

function IndexBody({ visited, onOpenRecord }: {
  visited: readonly string[];
  onOpenRecord: (code: string) => void;
}) {
  return (
    <>
      <h2 className="archive-heading">Archive index</h2>
      <p className="archive-lede">
        The index lists what the archive admits exists. Sealed bodies are held at the desk.
      </p>
      <ul className="archive-recent">
        {recentFilings().map((item) => (
          <li key={item.code}>
            <CodeLink item={item} visited={visited} onOpenRecord={onOpenRecord} />
            <span className="archive-recent-designation">{item.designation ?? <Redacted />}</span>
            <span className="circa-mono archive-recent-date">{item.filed}</span>
          </li>
        ))}
      </ul>
      <p className="archive-hint">Recently filed. Choose a class above to list the whole section.</p>
    </>
  );
}

function ResultsBody({ query, results, visited, onOpenRecord }: {
  query: ArchiveQuery;
  results: readonly ArchiveEntry[];
  visited: readonly string[];
  onOpenRecord: (code: string) => void;
}) {
  return (
    <>
      <h2 className="archive-heading">Search results</h2>
      <p className="archive-query-line">{describeQuery(query)}</p>
      <div className="archive-table-scroll">
        <table className="archive-table" aria-label="Search results">
          <thead>
            <tr>
              <th scope="col">Code</th>
              <th scope="col">Designation</th>
              <th scope="col">Class</th>
              <th scope="col">Filed</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {results.map((item) => (
              <tr key={item.code}>
                <td><CodeLink item={item} visited={visited} onOpenRecord={onOpenRecord} /></td>
                <td>{item.designation ?? <Redacted />}</td>
                <td>{CLASS_LABELS[item.klass]}</td>
                <td className="circa-mono">{item.filed}</td>
                <td><span className="archive-chip" data-status={item.status}>{STATUS_LABELS[item.status]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** Archive codes read as links. Visited ones keep a dotted rule, the browser's own tell. */
function CodeLink({ item, visited, onOpenRecord }: {
  item: ArchiveEntry;
  visited: readonly string[];
  onOpenRecord: (code: string) => void;
}) {
  return (
    <button type="button" className="archive-link circa-mono"
      data-visited={visited.includes(item.code) ? "true" : undefined}
      onClick={() => onOpenRecord(item.code)}>
      {item.code}
    </button>
  );
}

function NoMatchBody({ query, onWidenPeriod, onClear }: {
  query: ArchiveQuery;
  onWidenPeriod: () => void;
  onClear: () => void;
}) {
  return (
    <section className="archive-empty">
      <h2 className="archive-heading">No records match</h2>
      <p>{describeQuery(query)}</p>
      <ul className="archive-hints">
        <li>Incident codes are five digits after INC. Organization codes carry a carnage letter and six digits.</li>
        <li>A withheld designation is not searchable. Search its code instead.</li>
        <li>Filing dates run from the earliest ledger to the current year.</li>
      </ul>
      {query.period !== "any" && (
        <button type="button" className="archive-button" onClick={onWidenPeriod}>Search all periods</button>
      )}
      <button type="button" className="archive-button" onClick={onClear}>Clear filters</button>
    </section>
  );
}

function RecordBody({ code, onReturn, returnLabel }: { code: string; onReturn: () => void; returnLabel: string }) {
  const item = ARCHIVE_INDEX.find((candidate) => candidate.code === code);
  if (!item) {
    return (
      <section className="archive-empty">
        <h2 className="archive-heading">Entry not in the index</h2>
        <p className="circa-mono">{code}</p>
        <p>The code is well formed but no entry carries it. It may have been withdrawn after the index was rebuilt.</p>
        <button type="button" className="archive-button" onClick={onReturn}>Return to the index</button>
      </section>
    );
  }
  return (
    <article className="archive-record" aria-labelledby="archive-record-title">
      <p className="archive-record-code circa-mono">{item.code}</p>
      <h2 id="archive-record-title">{item.designation ?? <Redacted label="Designation withheld at Level 5" />}</h2>
      <table className="archive-fields">
        <tbody>
          <tr><th scope="row">Class</th><td>{CLASS_LABELS[item.klass]}</td></tr>
          <tr><th scope="row">Filed</th><td className="circa-mono">{item.filed}</td></tr>
          <tr><th scope="row">Status</th><td>{STATUS_LABELS[item.status]}</td></tr>
          <tr><th scope="row">Filed by</th><td className="circa-mono">{item.organization}</td></tr>
          <tr><th scope="row">Clearance</th><td>{item.clearance}</td></tr>
        </tbody>
      </table>
      <p className="archive-abstract">{item.abstract}</p>
      <p className="archive-note">
        Metadata only. The record body is rendered as a page of the archive once the record service is connected.
      </p>
      <button type="button" className="archive-button" onClick={onReturn}>{returnLabel}</button>
    </article>
  );
}

/** A withheld value, drawn as the design system's solid redaction bar. */
function Redacted({ label = "Designation withheld" }: { label?: string }) {
  return <span className="archive-redacted" role="img" aria-label={label} />;
}
