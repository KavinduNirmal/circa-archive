import { useTranslations } from "next-intl";
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

export function ArchiveRecords({
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
          <SiteSearch values={{ query: term, klass, status, period }} />
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
