import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { searchArchive, type ArchiveEntry, type ArchiveVocabulary } from "../browser/archive-index";
import { ArchiveChrome } from "./archive-chrome";
import { CLASS_MESSAGE_KEY, STATUS_MESSAGE_KEY, SITE_INDEX } from "./archive-data";
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

export function RecordTable({ entries, label, compact = false }: {
  entries: readonly ArchiveEntry[];
  label: string;
  compact?: boolean;
}) {
  const t = useTranslations("site");
  return (
    <div className={styles.tableWrap} role="region" aria-label={label} tabIndex={0}>
      <table className={styles.table}>
        <caption className={styles.caption}>{label}</caption>
        <thead>
          <tr>
            <th scope="col">{t("columnCode")}</th>
            <th scope="col">{t("columnDesignation")}</th>
            {!compact && <th scope="col">{t("columnClass")}</th>}
            <th scope="col">{t("columnFiled")}</th>
            {!compact && <th scope="col">{t("columnStatus")}</th>}
            {!compact && <th scope="col">{t("columnHolder")}</th>}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.code}>
              <th scope="row" className={styles.codeCell}>
                <Link href={`/site/records/${entry.code}`} aria-label={t("openRecord", { code: entry.code })}>
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
              {!compact && <td>{t(CLASS_MESSAGE_KEY[entry.klass])}</td>}
              <td className="circa-mono">{entry.filed}</td>
              {!compact && (
                <td>
                  <span className={styles.statusChip} data-status={entry.status}>
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

export function ArchiveRecords({ query = "" }: { query?: string }) {
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
  const results = term
    ? searchArchive({ text: term, klass: "all", period: "any" }, SITE_INDEX, vocabulary)
    : SITE_INDEX;

  return (
    <ArchiveChrome active="records" trail={[{ label: t("trailRecords") }]}>
      <main id="site-content" tabIndex={-1} className={styles.page}>
        <header className={styles.pageHead}>
          <p className={styles.kicker}>{t("crumbRegistry")}</p>
          <h1 className={styles.title}>{t("indexTitle")}</h1>
          <p className={styles.lede}>{t("indexLede")}</p>
          <SiteSearch value={term} large />
          <p className={styles.note}>{t("indexNote")}</p>
        </header>

        {term ? (
          <p className={styles.count}>
            {results.length > 0
              ? t("searchResults", { count: results.length, query: term })
              : t("searchNone", { query: term })}{" "}
            <Link href="/site/records">{t("searchClear")}</Link>
          </p>
        ) : (
          <p className={styles.count}>{t("indexCount", { count: SITE_INDEX.length })}</p>
        )}

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
