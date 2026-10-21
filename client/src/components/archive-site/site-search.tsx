import { useLocale, useTranslations } from "next-intl";
import { Search, SlidersHorizontal } from "lucide-react";
import {
  ARCHIVE_CLASSES,
  ARCHIVE_PERIODS,
  ARCHIVE_STATUSES,
  type ArchiveClass,
  type ArchivePeriod,
  type ArchiveStatus,
} from "../browser/archive-index";
import { ArchiveButton } from "./archive-button";
import buttonStyles from "./archive-button.module.css";
import { CLASS_MESSAGE_KEY, STATUS_MESSAGE_KEY } from "./archive-data";
import styles from "./archive-site.module.css";

/**
 * The archive's search, as a plain GET form with its filters attached.
 *
 * It is a form and not a client widget: submitting it loads the index with the
 * query and the filters in the address, which is what makes the search work
 * without JavaScript, survive a bookmark, and stay cheap on a slow connection.
 *
 * There are two weights of the same control. On the home and index pages the
 * filters are open on the page; in the masthead they sit behind a `<details>`,
 * because the masthead is a strip and the same form has to fit a search box.
 * Both submit every field, so a search from the top of the page applies exactly
 * the filters the reader can see.
 */
export type SiteSearchValues = {
  query?: string;
  klass?: ArchiveClass | "all";
  status?: ArchiveStatus | "all";
  period?: ArchivePeriod;
};

const PERIOD_MESSAGE_KEY: Record<ArchivePeriod, string> = {
  any: "filterAnyTime",
  current: "periodCurrent",
  recent: "periodRecent",
  historical: "periodHistorical",
};

export function SiteSearch({
  values = {},
  variant = "page",
}: {
  values?: SiteSearchValues;
  variant?: "page" | "masthead";
}) {
  const t = useTranslations("site");
  const locale = useLocale();
  const idPrefix = variant === "masthead" ? "masthead" : "page";
  const klass = values.klass ?? "all";
  const status = values.status ?? "all";
  const period = values.period ?? "any";

  return (
    <form
      className={variant === "page" ? styles.searchPage : styles.search}
      action={`/${locale}/site/records`}
      method="get"
      role="search"
      aria-label={t("searchLabel")}
    >
      <div className={styles.searchField}>
        <input
          id={`${idPrefix}-q`}
          name="q"
          type="search"
          defaultValue={values.query ?? ""}
          placeholder={t(
            variant === "masthead"
              ? "searchPlaceholderShort"
              : "searchPlaceholder",
          )}
          aria-label={t("searchLabel")}
          autoComplete="off"
        />
        <ArchiveButton
          type="submit"
          icon={<Search size={12} strokeWidth={2} aria-hidden="true" />}
        >
          {t("searchButton")}
        </ArchiveButton>
      </div>

      {variant === "page" ? (
        <>
          <div
            className={styles.filterBar}
            role="group"
            aria-labelledby={`${idPrefix}-filters`}
          >
            <p className={styles.filterLegend} id={`${idPrefix}-filters`}>
              {t("filtersLabel")}
            </p>
            <FilterFields
              idPrefix={idPrefix}
              klass={klass}
              status={status}
              period={period}
            />
            <ArchiveButton type="submit" className={styles.applyKey}>
              {t("applyFilters")}
            </ArchiveButton>
          </div>
          <p className={styles.searchHint}>{t("searchHint")}</p>
        </>
      ) : (
        <details className={styles.filterMenu}>
          <summary
            className={`${buttonStyles.button} ${styles.filterSummary}`}
            data-tone="steel"
          >
            <SlidersHorizontal size={12} strokeWidth={2} aria-hidden="true" />
            {t("filtersLabel")}
          </summary>
          <div
            className={styles.filterPanel}
            role="group"
            aria-label={t("filtersLabel")}
          >
            <FilterFields
              idPrefix={idPrefix}
              klass={klass}
              status={status}
              period={period}
            />
            <ArchiveButton type="submit" className={styles.filterPanelApply}>
              {t("applyFilters")}
            </ArchiveButton>
          </div>
        </details>
      )}
    </form>
  );
}

/**
 * The three filters the site adds to the workstation's query.
 *
 * A class, a status, and a filed range are the axes the index is actually
 * consultable by, so each is a named field in the same form rather than a link
 * that rebuilds the address by hand. Uncontrolled, because the form is a plain
 * GET: the server re-renders with what the reader chose.
 */
function FilterFields({
  idPrefix,
  klass,
  status,
  period,
}: {
  idPrefix: string;
  klass: ArchiveClass | "all";
  status: ArchiveStatus | "all";
  period: ArchivePeriod;
}) {
  const t = useTranslations("site");

  return (
    <>
      <div className={styles.filterField}>
        <label className={styles.filterLabel} htmlFor={`${idPrefix}-class`}>
          {t("filterClass")}
        </label>
        <select
          id={`${idPrefix}-class`}
          className={styles.select}
          name="class"
          defaultValue={klass}
        >
          <option value="all">{t("filterAllClasses")}</option>
          {ARCHIVE_CLASSES.map((item) => (
            <option key={item} value={item}>
              {t(CLASS_MESSAGE_KEY[item])}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.filterField}>
        <label className={styles.filterLabel} htmlFor={`${idPrefix}-status`}>
          {t("filterStatus")}
        </label>
        <select
          id={`${idPrefix}-status`}
          className={styles.select}
          name="status"
          defaultValue={status}
        >
          <option value="all">{t("filterAllStatuses")}</option>
          {ARCHIVE_STATUSES.map((item) => (
            <option key={item} value={item}>
              {t(STATUS_MESSAGE_KEY[item])}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.filterField}>
        <label className={styles.filterLabel} htmlFor={`${idPrefix}-period`}>
          {t("filterFiled")}
        </label>
        <select
          id={`${idPrefix}-period`}
          className={styles.select}
          name="period"
          defaultValue={period}
        >
          {ARCHIVE_PERIODS.map((item) => (
            <option key={item} value={item}>
              {t(PERIOD_MESSAGE_KEY[item])}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
