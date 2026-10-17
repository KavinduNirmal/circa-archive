import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArchiveChrome } from "./archive-chrome";
import { ORGANIZATIONS, STATUS_MESSAGE_KEY, filingsFor } from "./archive-data";
import styles from "./archive-site.module.css";

/**
 * The organizations directory.
 *
 * An organization is a directory entry, not a personnel account, so this page
 * prints what the index holds about a body and a count of the filings filed
 * under it — never a roster, a contact, or a claim about what the body is.
 */
export function ArchiveOrganizations() {
  const t = useTranslations("site");

  return (
    <ArchiveChrome active="organizations" trail={[{ label: t("trailOrganizations") }]}>
      <main id="site-content" tabIndex={-1} className={styles.page}>
        <header className={styles.pageHead}>
          <p className={styles.kicker}>{t("crumbRegistry")}</p>
          <h1 className={styles.title}>{t("orgTitle")}</h1>
          <p className={styles.lede}>{t("orgLede")}</p>
          <p className={styles.note}>{t("orgNote")}</p>
        </header>

        <ul className={styles.orgList}>
          {ORGANIZATIONS.map((organization) => (
            <li key={organization.code} className={styles.panel}>
              <h2 className={styles.panelTitle}>
                <Link href={`/site/records/${organization.code}`}>
                  {organization.designation ?? t("withheldDesignation")}
                </Link>
              </h2>
              <p className={styles.orgCode}>
                <span className="circa-mono">{organization.code}</span>
                <span className={styles.statusChip} data-status={organization.status}>
                  {t(STATUS_MESSAGE_KEY[organization.status])}
                </span>
                <span className={styles.orgFiled}>{organization.filed}</span>
              </p>
              <p className={styles.panelBody}>{organization.abstract}</p>
              <p className={styles.panelFoot}>
                <span className={styles.asideMeta}>{t("orgFilings", { count: filingsFor(organization.code) })}</span>
                <Link className={styles.more} href={`/site/records/${organization.code}`}>{t("orgOpen")} <span aria-hidden="true">»</span></Link>
              </p>
            </li>
          ))}
        </ul>
      </main>
    </ArchiveChrome>
  );
}
