import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import styles from "./archive-site.module.css";

/**
 * The archive's foot: the registry line, the edition mark, the directory, and
 * the return-to-top key.
 *
 * It is shared by the reading edition's chrome and the access register so every
 * page in the public shell ends the same way, whether or not it carries the
 * full masthead.
 */
export function ArchiveFooter() {
  const t = useTranslations("site");
  const institution = useTranslations("landing");

  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerRow}>
          <p>
            {institution("footerRegistry")} <span aria-hidden="true">·</span>{" "}
            {institution("footerService")}
          </p>
          <p className={styles.footerMeta}>
            {t("footerEdition")} <span aria-hidden="true">·</span>{" "}
            {t("circularReissue")}
          </p>
        </div>

        <nav className={styles.footerLinks} aria-label={t("footerLinksLabel")}>
          <Link href="/site">{t("navArchive")}</Link>
          <Link href="/site/records">{t("navRecords")}</Link>
          <Link href="/site/organizations">{t("navOrganizations")}</Link>
          <Link href="/site/about">{t("navAbout")}</Link>
          <Link href="/site/random">{t("randomTitle")}</Link>
          <Link href="/desktop">{t("navWorkstation")}</Link>
          <Link href="/meta">{t("aboutSite")}</Link>
          <Link href="/">{t("navPublic")}</Link>
        </nav>

        <p className={styles.footerFine}>
          <span>{t("footerEnd")}</span>
          <a href="#top">{institution("footerTop")}</a>
        </p>
      </div>
    </footer>
  );
}
