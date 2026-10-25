import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  searchArchive,
  type ArchiveClass,
  type ArchiveEntry,
  type ArchivePeriod,
  type ArchiveStatus,
  type ArchiveVocabulary,
  warningState,
} from "../browser/archive-index";
import { ArchiveChrome } from "./archive-chrome";
import {
  CLASS_MESSAGE_KEY,
  STATUS_MESSAGE_KEY,
  WARNING_MESSAGE_KEY,
  SITE_INDEX,
} from "./archive-data";
import { SiteSearch } from "./site-search";
import styles from "./archive-site.module.css";
import type { SearchState } from "@/lib/search/contract";
import type { SearchResponse, SearchResultItem } from "@/lib/search/fixture";
import type { SearchOutcome } from "@/lib/search/api";
import { toSearchHref } from "@/lib/search/query";
import { DEFAULT_SEARCH_STATE } from "@/lib/search/contract";
import { searchResultHref } from "@/lib/search/result";

/**
 * The index, and the table every page uses to show entries.
 *
 * Search is a server concern here: the query arrives in the address, the page
 * filters the index and sends back a table. That keeps the search working with
 * no JavaScript, makes a result a link somebody can paste, and means the index
 * is the same document whether it is read on a desktop or a phone.
 */

export function RecordTable({
  entries,
  label,
  compact = false,
}: {
  entries: readonly ArchiveEntry[];
  label: string;
  compact?: boolean;
}) {
  const t = useTranslations("site");
  const warningLabel = (entry: ArchiveEntry): string => {
    const state = warningState(entry);
    if (state === "none") return `${t("warningClear")} — ${t("warningNone")}`;
    const tags = entry.warnings
      .map((tag) => t(WARNING_MESSAGE_KEY[tag]))
      .join(", ");
    const disclosure =
      state === "author" ? t("warningAuthor") : t("warningPresent");
    return `${t("warningWarning")} — ${disclosure}: ${tags}`;
  };
  return (
    <div
      className={styles.tableWrap}
      role="region"
      aria-label={label}
      tabIndex={0}
    >
      <table className={styles.table}>
        <caption className={compact ? styles.captionSr : styles.caption}>
          {label}
        </caption>
        <thead>
          <tr>
            <th scope="col">{t("columnCode")}</th>
            <th scope="col">{t("columnDesignation")}</th>
            {!compact && <th scope="col">{t("columnClass")}</th>}
            <th scope="col">{t("columnWarnings")}</th>
            <th scope="col">{t("columnFiled")}</th>
            {!compact && <th scope="col">{t("columnStatus")}</th>}
            {!compact && <th scope="col">{t("columnHolder")}</th>}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.code}>
              <th
                scope="row"
                className={styles.codeCell}
                data-klass={entry.klass}
              >
                <Link
                  href={`/site/records/${entry.code}`}
                  aria-label={t("openRecord", { code: entry.code })}
                >
                  {entry.code}
                </Link>
              </th>
              <td>
                {entry.designation ?? (
                  <span className={styles.withheldDesignation}>
                    <span className={styles.withheldBars} aria-hidden="true" />
                    {t("withheldDesignation")}
                  </span>
                )}
              </td>
              {!compact && (
                <td>
                  <span className={styles.classTag} data-klass={entry.klass}>
                    {t(CLASS_MESSAGE_KEY[entry.klass])}
                  </span>
                </td>
              )}
              <td>
                <span
                  className={styles.warningTag}
                  data-warning={warningState(entry)}
                  role="img"
                  aria-label={warningLabel(entry)}
                  title={warningLabel(entry)}
                >
                  <span className={styles.warningSwatch} aria-hidden="true" />
                  {warningState(entry) === "none"
                    ? t("warningClear")
                    : t("warningWarning")}
                </span>
              </td>
              <td className="circa-mono">{entry.filed}</td>
              {!compact && (
                <td>
                  <span
                    className={styles.statusChip}
                    data-status={entry.status}
                  >
                    {t(STATUS_MESSAGE_KEY[entry.status])}
                  </span>
                </td>
              )}
              {!compact && <td className="circa-mono">{entry.organization}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * The index address with the current query and filters on it.
 *
 * `drop` leaves one filter out, which is what a chip's × needs: the same view,
 * minus the one thing the reader clicked away. Empty fields are omitted, so a
 * plain index is `/site/records` and not a string of `?q=&class=all`.
 */
function recordsHref(
  values: {
    query: string;
    klass: ArchiveClass | "all";
    status: ArchiveStatus | "all";
    period: ArchivePeriod;
  },
  drop?: "class" | "status" | "period",
) {
  const params = new URLSearchParams();
  if (values.query.trim()) params.set("q", values.query.trim());
  if (values.klass !== "all" && drop !== "class")
    params.set("class", values.klass);
  if (values.status !== "all" && drop !== "status")
    params.set("status", values.status);
  if (values.period !== "any" && drop !== "period")
    params.set("period", values.period);
  const search = params.toString();
  return search ? `/site/records?${search}` : "/site/records";
}

function LegacyArchiveRecords({
  query = "",
  klass = "all",
  status = "all",
  period = "any",
}: {
  query?: string;
  klass?: ArchiveClass | "all";
  status?: ArchiveStatus | "all";
  period?: ArchivePeriod;
}) {
  const t = useTranslations("site");
  const vocabulary: ArchiveVocabulary = {
    classes: {
      incident: t("classIncident"),
      organization: t("classOrganization"),
      continuity: t("classContinuity"),
      memo: t("classMemo"),
    },
    statuses: {
      "on-file": t("statusOnFile"),
      contested: t("statusContested"),
      sealed: t("statusSealed"),
      restricted: t("statusRestricted"),
      erased: t("statusErased"),
    },
  };
  const term = query.trim();
  const filtering =
    term !== "" || klass !== "all" || status !== "all" || period !== "any";
  const results = filtering
    ? searchArchive(
        { text: term, klass, period, status },
        SITE_INDEX,
        vocabulary,
      )
    : SITE_INDEX;

  const activeFilters: {
    key: "class" | "status" | "period";
    label: string;
    value: string;
  }[] = [];
  if (klass !== "all") {
    activeFilters.push({
      key: "class",
      label: t("filterClass"),
      value: t(CLASS_MESSAGE_KEY[klass]),
    });
  }
  if (status !== "all") {
    activeFilters.push({
      key: "status",
      label: t("filterStatus"),
      value: t(STATUS_MESSAGE_KEY[status]),
    });
  }
  if (period !== "any") {
    const labels: Record<ArchivePeriod, string> = {
      any: t("filterAnyTime"),
      current: t("periodCurrent"),
      recent: t("periodRecent"),
      historical: t("periodHistorical"),
    };
    activeFilters.push({
      key: "period",
      label: t("filterFiled"),
      value: labels[period],
    });
  }

  return (
    <ArchiveChrome active="records" trail={[{ label: t("trailRecords") }]}>
      <main id="site-content" tabIndex={-1} className={styles.page}>
        <header className={styles.pageHead}>
          <p className={styles.kicker}>{t("crumbRegistry")}</p>
          <h1 className={styles.title}>{t("indexTitle")}</h1>
          <p className={styles.lede}>{t("indexLede")}</p>
          <SiteSearch values={{ ...DEFAULT_SEARCH_STATE, q: term }} />
          <p className={styles.note}>{t("indexNote")}</p>
        </header>

        <div className={styles.resultBar}>
          <p className={styles.count}>
            {term
              ? results.length > 0
                ? t("searchResults", { count: results.length, query: term })
                : t("searchNone", { query: term })
              : filtering
                ? results.length > 0
                  ? t("filteredCount", { count: results.length })
                  : t("filterNone")
                : t("indexCount", { count: SITE_INDEX.length })}{" "}
            {term ? (
              <Link
                href={recordsHref({
                  query: term,
                  klass: "all",
                  status: "all",
                  period: "any",
                })}
              >
                {t("searchClear")}
              </Link>
            ) : null}
          </p>

          {activeFilters.length > 0 ? (
            <ul className={styles.filterTags} aria-label={t("activeFilters")}>
              {activeFilters.map((filter) => (
                <li key={filter.key} className={styles.filterTag}>
                  <span className={styles.filterTagLabel}>{filter.label}</span>
                  <span className={styles.filterTagValue}>{filter.value}</span>
                  <Link
                    href={recordsHref(
                      { query: term, klass, status, period },
                      filter.key,
                    )}
                    aria-label={t("removeFilter", { filter: filter.label })}
                  >
                    ×
                  </Link>
                </li>
              ))}
              <li className={styles.filterTagClear}>
                <Link
                  href={recordsHref({
                    query: term,
                    klass: "all",
                    status: "all",
                    period: "any",
                  })}
                >
                  {t("clearFilters")}
                </Link>
              </li>
            </ul>
          ) : null}
        </div>

        {results.length > 0 ? (
          <RecordTable
            entries={results}
            label={term ? `${t("searchLabel")}: ${term}` : t("indexTitle")}
          />
        ) : null}
      </main>
    </ArchiveChrome>
  );
}

const labelKey = (value: string) =>
  `searchOption${value.replace(/(^|-)([a-z])/g, (_, _dash, letter: string) => letter.toUpperCase())}`;

type GlobalSearchProps = { state: SearchState; outcome: SearchOutcome };
type LegacySearchProps = {
  query?: string;
  klass?: ArchiveClass | "all";
  status?: ArchiveStatus | "all";
  period?: ArchivePeriod;
};

export function ArchiveRecords(props: GlobalSearchProps | LegacySearchProps) {
  if (!("state" in props)) return <LegacyArchiveRecords {...props} />;
  return <GlobalSearchRecords state={props.state} outcome={props.outcome} />;
}

function GlobalSearchRecords({ state, outcome }: GlobalSearchProps) {
  const t = useTranslations("site");
  const locale = useLocale();
  if (outcome.status !== "success") {
    const rateLimited = outcome.status === "rate-limited";
    return (
      <ArchiveChrome
        active="records"
        trail={[{ label: t("trailRecords") }]}
        searchValues={state}
      >
        <main id="site-content" tabIndex={-1} className={styles.page}>
          <header className={styles.pageHead}>
            <p className={styles.kicker}>{t("crumbRegistry")}</p>
            <h1 className={styles.title}>{t("indexTitle")}</h1>
            <p className={styles.lede}>{t("indexLede")}</p>
            <SiteSearch values={state} />
          </header>
          <div className={styles.searchError} role="alert">
            <h2 className={styles.emptyTitle}>
              {t(rateLimited ? "searchRateLimitTitle" : "searchErrorTitle")}
            </h2>
            <p>{t(rateLimited ? "searchRateLimitBody" : "searchErrorBody")}</p>
            <a href={`/${locale}${toSearchHref(state)}`}>
              {t("searchErrorRetry")}
            </a>
          </div>
        </main>
      </ArchiveChrome>
    );
  }
  const response = outcome.response;
  const pages = response.page.totalPages;
  const hasFilters = Boolean(
    state.holder ||
    state.types.length ||
    state.classes.length ||
    state.statuses.length ||
    state.warnings.length ||
    state.disclosures.length ||
    state.warningTags.length ||
    state.excludedWarningTags.length ||
    state.period !== "any" ||
    state.from ||
    state.to ||
    state.language !== "en",
  );
  const summary =
    response.page.total === 0
      ? state.q
        ? t("searchNone", { query: state.q })
        : t("filterNone")
      : state.q
        ? t("searchResults", { count: response.page.total, query: state.q })
        : hasFilters
          ? t("filteredCount", { count: response.page.total })
          : t("indexCount", { count: response.page.total });

  return (
    <ArchiveChrome
      active="records"
      trail={[{ label: t("trailRecords") }]}
      searchValues={state}
    >
      <main id="site-content" tabIndex={-1} className={styles.page}>
        <header className={styles.pageHead}>
          <p className={styles.kicker}>{t("crumbRegistry")}</p>
          <h1 className={styles.title}>{t("indexTitle")}</h1>
          <p className={styles.lede}>{t("indexLede")}</p>
          <SiteSearch values={state} />
          <p className={styles.note}>{t("indexNote")}</p>
        </header>
        <SearchActive state={state} />
        <p className={styles.count} role="status" aria-live="polite">
          {summary}
          {pages > 1
            ? ` · ${t("searchPageCount", { page: response.page.number, pages })}`
            : ""}
        </p>
        {response.page.total === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>
              {response.meta.codeMatch === "reserved"
                ? t("searchCodeReserved", { code: state.q })
                : response.meta.codeMatch === "missing"
                  ? t("searchCodeMissing", { code: state.q })
                  : state.q
                    ? t("searchNoMatchesHelp")
                    : t("searchFilterNoMatchesHelp")}
            </p>
            <a href={`/${locale}/site/records`}>{t("clearFilters")}</a>
          </div>
        ) : (
          <GlobalSearchTable
            items={response.items}
            label={t("searchResultsTable")}
            query={state.q}
          />
        )}
        <SearchPagination state={state} response={response} />
      </main>
    </ArchiveChrome>
  );
}

function SearchActive({ state }: { state: SearchState }) {
  const t = useTranslations("site");
  const locale = useLocale();
  const chips: { label: string; value: string; href: string; key: string }[] =
    [];
  const arrays: [keyof SearchState, string, readonly string[]][] = [
    ["types", t("searchType"), state.types],
    ["classes", t("searchClass"), state.classes],
    ["statuses", t("searchStatus"), state.statuses],
    ["warnings", t("searchWarningTier"), state.warnings],
    ["disclosures", t("searchDisclosure"), state.disclosures],
    ["warningTags", t("searchWarningTags"), state.warningTags],
    ["excludedWarningTags", t("searchExcludedTags"), state.excludedWarningTags],
  ];
  for (const [field, label, values] of arrays)
    for (const value of values) {
      const next = {
        ...state,
        [field]: values.filter((item) => item !== value),
        page: 1,
      } as SearchState;
      chips.push({
        label,
        value: t(labelKey(value)),
        href: `/${locale}${toSearchHref(next)}`,
        key: `${String(field)}:${value}`,
      });
    }
  if (state.period !== "any")
    chips.push({
      label: t("filterFiled"),
      value: t(labelKey(state.period)),
      href: `/${locale}${toSearchHref(state, { period: "any", page: 1 })}`,
      key: "period",
    });
  if (state.from)
    chips.push({
      label: t("searchFrom"),
      value: state.from,
      href: `/${locale}${toSearchHref(state, { from: "", page: 1 })}`,
      key: "from",
    });
  if (state.to)
    chips.push({
      label: t("searchTo"),
      value: state.to,
      href: `/${locale}${toSearchHref(state, { to: "", page: 1 })}`,
      key: "to",
    });
  if (state.holder)
    chips.push({
      label: t("searchHolderCode"),
      value: state.holder,
      href: `/${locale}${toSearchHref(state, { holder: "", page: 1 })}`,
      key: "holder",
    });
  if (state.language !== "en")
    chips.push({
      label: t("searchLanguage"),
      value: t(labelKey(state.language)),
      href: `/${locale}${toSearchHref(state, { language: "en", page: 1 })}`,
      key: "language",
    });
  if (state.sort !== (state.q || state.holder ? "relevance" : "newest"))
    chips.push({
      label: t("searchSort"),
      value: t(labelKey(state.sort)),
      href: `/${locale}${toSearchHref(state, { sort: state.q || state.holder ? "relevance" : "newest", page: 1 })}`,
      key: "sort",
    });
  if (state.limit !== 20)
    chips.push({
      label: t("searchLimit"),
      value: t(`searchLimit${state.limit}`),
      href: `/${locale}${toSearchHref(state, { limit: 20, page: 1 })}`,
      key: "limit",
    });
  if (!chips.length && !state.q) return null;
  const clearState: SearchState = {
    ...state,
    q: "",
    holder: "",
    types: [],
    classes: [],
    statuses: [],
    warnings: [],
    disclosures: [],
    warningTags: [],
    excludedWarningTags: [],
    period: "any",
    from: "",
    to: "",
    language: "en",
    sort: "newest",
    page: 1,
    limit: 20,
  };
  return (
    <ul className={styles.filterTags} aria-label={t("activeFilters")}>
      {state.q && (
        <li className={styles.filterTag}>
          <span className={styles.filterTagLabel}>{t("searchLabel")}</span>
          <span className={styles.filterTagValue}>{state.q}</span>
          <a
            href={`/${locale}${toSearchHref(state, { q: "", page: 1 })}`}
            aria-label={t("searchClear")}
          >
            ×
          </a>
        </li>
      )}
      {chips.map((chip) => (
        <li key={chip.key} className={styles.filterTag}>
          <span className={styles.filterTagLabel}>{chip.label}</span>
          <span className={styles.filterTagValue}>{chip.value}</span>
          <a
            href={chip.href}
            aria-label={t("removeFilter", { filter: chip.label })}
          >
            ×
          </a>
        </li>
      ))}
      <li className={styles.filterTagClear}>
        <a href={`/${locale}${toSearchHref(clearState)}`}>
          {t("clearFilters")}
        </a>
      </li>
    </ul>
  );
}

function GlobalSearchTable({
  items,
  label,
  query,
}: {
  items: readonly SearchResultItem[];
  label: string;
  query: string;
}) {
  const t = useTranslations("site");
  const locale = useLocale();
  return (
    <div
      className={styles.tableWrap}
      role="region"
      aria-label={label}
      tabIndex={0}
    >
      <table className={styles.table}>
        <caption className={styles.caption}>{label}</caption>
        <thead>
          <tr>
            <th scope="col">{t("columnCode")}</th>
            <th scope="col">{t("columnDesignation")}</th>
            <th scope="col">{t("searchType")}</th>
            <th scope="col">{t("columnWarnings")}</th>
            <th scope="col">{t("searchWarningTags")}</th>
            <th scope="col">{t("columnFiled")}</th>
            <th scope="col">{t("columnStatus")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const href = searchResultHref(item);
            const destination = href ? `/${locale}${href}` : null;
            const displayCode =
              item.type === "record" &&
              item.code === null &&
              item.referenceNumber !== null
                ? `${item.displayCode} · ${item.referenceNumber}`
                : item.displayCode;
            const warningLabel =
              item.warning.tags.map((tag) => t(labelKey(tag))).join(", ") ||
              t(labelKey(item.warning.disclosure ?? "not-provided"));
            const klass = item.class ?? item.type;
            const warning = item.warning.tags.length
              ? "present"
              : item.warning.disclosure === "none"
                ? "author"
                : "none";
            const warningStatus =
              warning === "none" ? t("warningClear") : t("warningWarning");
            const warningDescription = `${warningStatus} — ${warning === "author" ? t("warningAuthor") : warning === "present" ? t("warningPresent") : t("warningNone")}: ${warningLabel}`;
            return (
              <tr key={item.id}>
                <th scope="row" className={styles.codeCell} data-klass={klass}>
                  {destination ? (
                    <a
                      href={destination}
                      aria-label={t("openRecord", { code: displayCode })}
                    >
                      {displayCode}
                    </a>
                  ) : (
                    displayCode
                  )}
                </th>
                <td>
                  {destination ? (
                    <a href={destination}>
                      {item.title
                        ? highlight(item.title, query)
                        : t("withheldDesignation")}
                    </a>
                  ) : item.title ? (
                    highlight(item.title, query)
                  ) : (
                    t("withheldDesignation")
                  )}
                  {item.excerpt && (
                    <p className={styles.searchExcerpt}>
                      {renderHighlights(item.excerpt, item.highlights)}
                    </p>
                  )}
                  {item.status === "sealed" && item.redacted && (
                    <p className={styles.sealedNotice}>
                      ▣{" "}
                      {t(
                        item.type === "incident"
                          ? "searchSealedIncident"
                          : "searchSealedRecord",
                      )}
                    </p>
                  )}
                </td>
                <td>
                  <div className={styles.resultTypes}>
                    <span className={styles.classTag} data-klass={item.type}>
                      {t(labelKey(item.type))}
                    </span>
                    {item.class && (
                      <span className={styles.classTag} data-klass={item.class}>
                        {t(labelKey(item.class))}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <span
                    className={styles.warningTag}
                    data-warning={warning}
                    role="img"
                    aria-label={warningDescription}
                    title={warningDescription}
                  >
                    <span className={styles.warningSwatch} aria-hidden="true" />
                    {warningStatus}
                  </span>
                </td>
                <td>
                  <span
                    className={styles.warningLabels}
                    data-tier={item.warning.tier}
                  >
                    {warningLabel}
                  </span>
                </td>
                <td className="circa-mono">{item.filedAt.slice(0, 10)}</td>
                <td>
                  <span className={styles.statusChip} data-status={item.status}>
                    {t(labelKey(item.status))}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function highlight(text: string, query: string) {
  const start = text
    .toLocaleLowerCase()
    .indexOf(query.trim().toLocaleLowerCase());
  if (!query.trim() || start < 0) return text;
  const end = start + query.trim().length;
  return (
    <>
      {text.slice(0, start)}
      <mark>{text.slice(start, end)}</mark>
      {text.slice(end)}
    </>
  );
}

function renderHighlights(
  text: string,
  ranges: readonly { start: number; end: number }[],
) {
  const valid = ranges
    .filter(({ start, end }) => start >= 0 && end > start && end <= text.length)
    .sort((a, b) => a.start - b.start);
  if (!valid.length) return text;
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const [index, range] of valid.entries()) {
    if (range.start < cursor) continue;
    if (range.start > cursor) parts.push(text.slice(cursor, range.start));
    parts.push(
      <mark key={`hit-${index}`}>{text.slice(range.start, range.end)}</mark>,
    );
    cursor = range.end;
  }
  parts.push(text.slice(cursor));
  return <>{parts}</>;
}

function SearchPagination({
  state,
  response,
}: {
  state: SearchState;
  response: SearchResponse;
}) {
  const t = useTranslations("site");
  const locale = useLocale();
  const pages = response.page.totalPages;
  if (pages < 2) return null;
  return (
    <nav className={styles.searchPagination} aria-label={t("searchPagination")}>
      {response.page.number > 1 && (
        <a
          href={`/${locale}${toSearchHref(state, { page: response.page.number - 1 })}`}
        >
          {t("searchPrevious")}
        </a>
      )}
      {Array.from({ length: pages }, (_, index) => index + 1).map((page) => (
        <a
          key={page}
          href={`/${locale}${toSearchHref(state, { page })}`}
          aria-current={page === response.page.number ? "page" : undefined}
        >
          {page}
        </a>
      ))}
      {response.page.number < pages && (
        <a
          href={`/${locale}${toSearchHref(state, { page: response.page.number + 1 })}`}
        >
          {t("searchNext")}
        </a>
      )}
    </nav>
  );
}
