"use client";

import { Fragment } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  ARCHIVE_CLASSES,
  ARCHIVE_PERIODS,
  ARCHIVE_STATUSES,
  countClass,
  recentFilings,
  type ArchiveClass,
  type ArchiveEntry,
  type ArchivePeriod,
  type ArchiveQuery,
  type ArchiveStatus,
  type ArchiveVocabulary,
} from "./archive-index";

/**
 * Which document the single tab is currently showing.
 *
 * There is no record document. A record is read in the reader, which is the
 * screen built for reading one; an index page that also rendered records was
 * two readers to keep in step, and the second one had no margins, no scale, and
 * no follow-ups. Clicking a code hands it to the reader and leaves the index on
 * the screen behind it.
 */
export type ArchiveDocument =
  | { kind: "home" }
  | { kind: "results"; query: ArchiveQuery };

export type ArchiveTextSize = "small" | "normal" | "large";

/**
 * The archive's own vocabulary, by catalog key.
 *
 * The index module classifies an entry; the page is what names the
 * classification to a reader, so the words are messages here and not constants
 * over there. Naming a key once keeps one word in one language in every place
 * that word appears — a section link, a select option, a table cell, a menu
 * radio.
 */
export const CLASS_MESSAGE_KEYS: Record<ArchiveClass, string> = {
  incident: "classIncident",
  organization: "classOrganization",
  continuity: "classContinuity",
  memo: "classMemo",
};

export const STATUS_MESSAGE_KEYS: Record<ArchiveStatus, string> = {
  "on-file": "statusOnFile",
  contested: "statusContested",
  sealed: "statusSealed",
  restricted: "statusRestricted",
  erased: "statusErased",
};

export const PERIOD_MESSAGE_KEYS: Record<ArchivePeriod, string> = {
  any: "periodAny",
  current: "periodCurrent",
  recent: "periodRecent",
  historical: "periodHistorical",
};

export const TEXT_SIZE_MESSAGE_KEYS: Record<ArchiveTextSize, string> = {
  small: "textSizeSmall",
  normal: "textSizeNormal",
  large: "textSizeLarge",
};

/** A translator as this module's helpers take it, so none of them needs the hook. */
type BrowserTranslate = (key: string, values?: Record<string, string | number>) => string;

/**
 * The class and status words as this reader sees them.
 *
 * The page is what names a class and a status on screen, so the page is also
 * what knows which words those are. The index takes them as a plain vocabulary
 * and matches a query against them, which is how a Korean reader searching for
 * 봉인됨 finds the entry whose chip reads 봉인됨.
 */
export function archiveVocabulary(t: BrowserTranslate): ArchiveVocabulary {
  const classes = {} as Record<ArchiveClass, string>;
  for (const klass of ARCHIVE_CLASSES) classes[klass] = t(CLASS_MESSAGE_KEYS[klass]);
  const statuses = {} as Record<ArchiveStatus, string>;
  for (const status of ARCHIVE_STATUSES) statuses[status] = t(STATUS_MESSAGE_KEYS[status]);
  return { classes, statuses };
}

/**
 * The query line above a results table and inside the no-match state.
 *
 * The index module can describe a query in its own words, but a description of
 * a search is interface copy: it has to speak the reader's language, so it is
 * composed into a message here rather than printed from a constant.
 */
export function summariseQuery(t: BrowserTranslate, query: ArchiveQuery): string {
  return [
    query.text.trim() ? t("queryTerm", { term: query.text.trim() }) : t("queryWholeIndex"),
    t("queryClass", { klass: query.klass === "all" ? t("classAll") : t(CLASS_MESSAGE_KEYS[query.klass]) }),
    t("queryFiled", { filed: t(PERIOD_MESSAGE_KEYS[query.period]) }),
  ].join(" · ");
}

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
  /** Hands a code to the record reader, which is where a record is read. */
  onOpenRecord: (code: string) => void;
  onIndexLink: (klass: ArchiveClass) => void;
  onWidenPeriod: () => void;
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
  const { document, draft, results, visited, textSize, onDraftChange, onSearch, onClear, onOpenRecord, onIndexLink, onWidenPeriod } = props;
  const t = useTranslations("browser");

  return (
    <div className="archive-page" data-testid="archive-page" data-text-size={textSize}>
      <header className="archive-masthead">
        <div className="archive-masthead-id">
          <Image className="archive-seal" src={ARCHIVE_SEAL} alt="" width={56} height={56} />
          <div className="archive-masthead-text">
            <p className="archive-kicker">{t("archiveKicker")}</p>
            <p className="archive-title">{t("archiveTitle")}</p>
            <p className="archive-subtitle">{t("agency")}</p>
          </div>
        </div>
        <p className="archive-clearance">{t("clearanceStamp")}</p>
      </header>

      <nav className="archive-sections" aria-label={t("sectionsLabel")}>
        <button type="button" className="archive-tablink"
          aria-current={document.kind === "home" ? "page" : undefined} onClick={onClear}>
          {t("indexTab")}
        </button>
        {ARCHIVE_CLASSES.map((klass) => (
          <Fragment key={klass}>
            <span className="archive-separator" aria-hidden="true">|</span>
            <button type="button" className="archive-tablink"
              aria-current={document.kind === "results" && document.query.klass === klass ? "true" : undefined}
              onClick={() => onIndexLink(klass)}>
              {t("classIndexLink", { klass: t(CLASS_MESSAGE_KEYS[klass]), count: countClass(klass) })}
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

      <footer className="archive-footer">
        <p>{t("footerNotice")}</p>
        <p className="circa-mono">{t("footerRebuilt")}</p>
        {/* The preview's honesty marker: these entries are fixture content, not canon. */}
        <p className="archive-fixture">{t("footerFixture")}</p>
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
  const t = useTranslations("browser");
  return (
    <form className="archive-search" role="search" aria-label={t("searchLabel")} data-variant={variant}
      onSubmit={(event) => { event.preventDefault(); onSearch(); }}>
      <fieldset className="archive-fieldset">
        <legend className="archive-legend">{t("searchLegend")}</legend>
        <div className="archive-search-fields">
          <div className="archive-field archive-field-query">
            <label htmlFor="archive-query">{t("searchRecords")}</label>
            <input id="archive-query" className="archive-input circa-mono" type="text" autoComplete="off"
              spellCheck={false} placeholder={t("searchPlaceholder")}
              value={draft.text} onChange={(event) => onDraftChange({ ...draft, text: event.target.value })} />
          </div>
          <div className="archive-field">
            <label htmlFor="archive-class">{t("fieldClass")}</label>
            <select id="archive-class" className="archive-select" value={draft.klass}
              onChange={(event) => onDraftChange({ ...draft, klass: event.target.value as ArchiveClass | "all" })}>
              <option value="all">{t("classAllOption")}</option>
              {ARCHIVE_CLASSES.map((klass) => <option key={klass} value={klass}>{t(CLASS_MESSAGE_KEYS[klass])}</option>)}
            </select>
          </div>
          <div className="archive-field">
            <label htmlFor="archive-period">{t("fieldFiled")}</label>
            <select id="archive-period" className="archive-select" value={draft.period}
              onChange={(event) => onDraftChange({ ...draft, period: event.target.value as ArchivePeriod })}>
              {ARCHIVE_PERIODS.map((period) => <option key={period} value={period}>{t(PERIOD_MESSAGE_KEYS[period])}</option>)}
            </select>
          </div>
          <div className="archive-actions">
            <button type="submit" className="archive-button">{t("searchButton")}</button>
            <button type="button" className="archive-button" onClick={onClear}>{t("clear")}</button>
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
  const t = useTranslations("browser");
  return (
    <>
      <h2 className="archive-heading">{t("indexHeading")}</h2>
      <p className="archive-lede">
        {t("indexLede")}
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
      <p className="archive-hint">{t("indexHint")}</p>
    </>
  );
}

function ResultsBody({ query, results, visited, onOpenRecord }: {
  query: ArchiveQuery;
  results: readonly ArchiveEntry[];
  visited: readonly string[];
  onOpenRecord: (code: string) => void;
}) {
  const t = useTranslations("browser");
  return (
    <>
      <h2 className="archive-heading">{t("searchResults")}</h2>
      <p className="archive-query-line">{summariseQuery(t, query)}</p>
      <div className="archive-table-scroll">
        <table className="archive-table" aria-label={t("searchResults")}>
          <thead>
            <tr>
              <th scope="col">{t("fieldCode")}</th>
              <th scope="col">{t("fieldDesignation")}</th>
              <th scope="col">{t("fieldClass")}</th>
              <th scope="col">{t("fieldFiled")}</th>
              <th scope="col">{t("fieldStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {results.map((item) => (
              <tr key={item.code}>
                <td><CodeLink item={item} visited={visited} onOpenRecord={onOpenRecord} /></td>
                <td>{item.designation ?? <Redacted />}</td>
                <td>{t(CLASS_MESSAGE_KEYS[item.klass])}</td>
                <td className="circa-mono">{item.filed}</td>
                <td><span className="archive-chip" data-status={item.status}>{t(STATUS_MESSAGE_KEYS[item.status])}</span></td>
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
  const t = useTranslations("browser");
  return (
    <section className="archive-empty">
      <h2 className="archive-heading">{t("noMatchHeading")}</h2>
      <p>{summariseQuery(t, query)}</p>
      <ul className="archive-hints">
        <li>{t("hintCodes")}</li>
        <li>{t("hintWithheld")}</li>
        <li>{t("hintDates")}</li>
      </ul>
      {query.period !== "any" && (
        <button type="button" className="archive-button" onClick={onWidenPeriod}>{t("searchAllPeriods")}</button>
      )}
      <button type="button" className="archive-button" onClick={onClear}>{t("clearFilters")}</button>
    </section>
  );
}

/** A withheld value, drawn as the design system's solid redaction bar. */
function Redacted() {
  const t = useTranslations("browser");
  return <span className="archive-redacted" role="img" aria-label={t("designationWithheld")} />;
}
