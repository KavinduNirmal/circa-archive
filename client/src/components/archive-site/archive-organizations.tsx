import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, FolderOpen, Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ArchiveButton } from "./archive-button";
import { ArchiveChrome } from "./archive-chrome";
import { ORGANIZATIONS, STATUS_MESSAGE_KEY, filingsFor } from "./archive-data";
import styles from "./archive-site.module.css";

/**
 * The organizations directory.
 *
 * An organization is a directory entry, not a personnel account, so this page
 * prints what the index holds about a body and a count of the filings filed
 * under it — never a roster, a contact, or a claim about what the body is.
 *
 * The page is a ledger leaf: the heading carries the totals, the search sits
 * directly under it, and every body is a numbered entry with its holdings set
 * as a tally in the margin. A tally is what makes the page worth reading — a
 * directory of names is a list, a directory of names and counts is a register.
 *
 * The search is the same plain GET form the index uses, pointed at the
 * directory: the query arrives in the address, the page filters the bodies, and
 * the result survives a bookmark without a line of JavaScript.
 */
export function ArchiveOrganizations({ query = "" }: { query?: string }) {
  const t = useTranslations("site");
  const locale = useLocale();
  const term = query.trim().toLowerCase();
  const entries = term
    ? ORGANIZATIONS.filter((organization) =>
        `${organization.code} ${organization.designation ?? ""} ${organization.abstract}`
          .toLowerCase()
          .includes(term),
      )
    : ORGANIZATIONS;

  const filedDates = ORGANIZATIONS.map((organization) => organization.filed).sort();
  const totalFilings = ORGANIZATIONS.reduce((sum, organization) => sum + filingsFor(organization.code), 0);

  return (
    <ArchiveChrome active="organizations" trail={[{ label: t("trailOrganizations") }]}>
      <main id="site-content" tabIndex={-1} className={styles.page}>
        <header className={styles.pageHead}>
          <div className={styles.orgHead}>
            <div className={styles.orgHeadText}>
              <p className={styles.kicker}>{t("crumbRegistry")}</p>
              <h1 className={styles.title}>{t("orgTitle")}</h1>
              <p className={styles.lede}>{t("orgLede")}</p>
            </div>

            {/* The ledger block: the four figures a clerk would want first. */}
            <dl className={styles.orgLedger}>
              <div>
                <dt>{t("ledgerBodies")}</dt>
                <dd>{ORGANIZATIONS.length}</dd>
              </div>
              <div>
                <dt>{t("ledgerFilings")}</dt>
                <dd>{totalFilings}</dd>
              </div>
              <div>
                <dt>{t("ledgerEarliest")}</dt>
                <dd className="circa-mono">{filedDates[0]}</dd>
              </div>
              <div>
                <dt>{t("ledgerLatest")}</dt>
                <dd className="circa-mono">{filedDates[filedDates.length - 1]}</dd>
              </div>
            </dl>
          </div>

          <form
            className={styles.searchPage}
            action={`/${locale}/site/organizations`}
            method="get"
            role="search"
            aria-label={t("orgSearchLabel")}
          >
            <div className={styles.searchField}>
              <input
                id="org-q"
                name="q"
                type="search"
                defaultValue={query}
                placeholder={t("orgSearchPlaceholder")}
                aria-label={t("orgSearchLabel")}
                autoComplete="off"
              />
              <ArchiveButton type="submit" icon={<Search size={12} strokeWidth={2} aria-hidden="true" />}>
                {t("searchButton")}
              </ArchiveButton>
            </div>
          </form>

          <p className={styles.note}>{t("orgNote")}</p>
        </header>

        {entries.length > 0 ? (
          <>
            <p className={styles.resultBar}>
              <span className={styles.count}>
                {term
                  ? t("orgSearchResults", { count: entries.length, query: query.trim() })
                  : t("orgCount", { count: ORGANIZATIONS.length })}
              </span>
              {term ? <Link href="/site/organizations">{t("searchClear")}</Link> : null}
            </p>

            <ul className={styles.orgList}>
              {entries.map((organization, index) => {
                const holdings = filingsFor(organization.code);
                return (
                  <li key={organization.code} className={styles.orgEntry}>
                    <span className={styles.orgNo} aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className={styles.orgBody}>
                      <p className={styles.orgMeta}>
                        <span className={styles.orgCode} data-klass="organization">{organization.code}</span>
                        <span className={styles.statusChip} data-status={organization.status}>
                          {t(STATUS_MESSAGE_KEY[organization.status])}
                        </span>
                        <span className={styles.orgFiled}>{organization.filed}</span>
                      </p>
                      <h2 className={styles.orgName}>
                        <Link href={`/site/records/${organization.code}`}>
                          {organization.designation ?? t("withheldDesignation")}
                        </Link>
                      </h2>
                      <p className={styles.orgAbstract}>{organization.abstract}</p>
                    </div>

                    <div className={styles.orgTally}>
                      <span className={styles.orgTallyValue}>{String(holdings).padStart(2, "0")}</span>
                      <span className={styles.orgTallyLabel}>{t("ledgerFilings")}</span>
                      <Link className={styles.orgOpen} href={`/site/records/${organization.code}`}>
                        <FolderOpen size={12} strokeWidth={1.9} aria-hidden="true" />
                        {t("orgOpen")}
                        <ArrowRight size={11} strokeWidth={2.2} aria-hidden="true" />
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <div className={styles.emptyState} role="status">
            <Search size={20} strokeWidth={1.6} aria-hidden="true" />
            <p className={styles.emptyTitle}>{t("orgSearchNone", { query: query.trim() })}</p>
            <ArchiveButton tone="paper" href="/site/organizations" icon={<ArrowRight size={13} strokeWidth={1.9} aria-hidden="true" />}>
              {t("searchClear")}
            </ArchiveButton>
          </div>
        )}
      </main>
    </ArchiveChrome>
  );
}
