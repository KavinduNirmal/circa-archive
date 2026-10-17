import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "../language-switcher";
import { SITE_INDEX } from "./archive-data";
import { SiteSearch } from "./site-search";
import styles from "./archive-site.module.css";

/**
 * The public archive's frame.
 *
 * A full-page reading site, not the agency's portal: the masthead carries the
 * search box on every page, the section bar carries the archive's own
 * destinations, and a site notice runs under it. The frame is full-bleed and
 * only its inner measure is constrained, which is what separates a tool from a
 * notice board.
 *
 * The one link that leaves the fiction is "About the site", and it says so: it
 * goes to the project page, where the archive is described as what it is. The
 * rest of the chrome speaks as the Commission.
 */

export type ArchiveSection = "archive" | "records" | "organizations" | "about";

export type ArchiveCrumb = { label: string; href?: string };

const NAV: readonly { section: ArchiveSection; key: string; href: string }[] = [
  { section: "archive", key: "navArchive", href: "/site" },
  { section: "records", key: "navRecords", href: "/site/records" },
  { section: "organizations", key: "navOrganizations", href: "/site/organizations" },
  { section: "about", key: "navAbout", href: "/site/about" },
];

export function ArchiveChrome({ active, trail, children }: {
  active: ArchiveSection;
  trail: readonly ArchiveCrumb[];
  children: React.ReactNode;
}) {
  const t = useTranslations("site");
  // The institution's own name and service, borrowed from the public portal.
  const institution = useTranslations("landing");

  return (
    <div className={styles.shell} id="top">
      <a className={styles.skip} href="#site-content">{t("skip")}</a>

      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Link className={styles.brand} href="/site">
            <span className={styles.brandMark} aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/circa_eye.svg" alt="" width={34} height={34} draggable={false} />
            </span>
            <span className={styles.brandText}>
              <strong>{t("brandName")}</strong>
              <small>{t("brandSubtitle")}</small>
            </span>
          </Link>

          <SiteSearch />

          <div className={styles.topbarTools}>
            <LanguageSwitcher className={styles.language} />
            <Link className={styles.metaButton} href="/meta/about">{t("aboutSite")}</Link>
          </div>
        </div>
      </header>

      <nav className={styles.nav} aria-label={t("navLabel")}>
        <div className={styles.navInner}>
          {NAV.map((item) => (
            <Link key={item.section} className={styles.navLink} href={item.href} aria-current={item.section === active ? "page" : undefined}>
              {t(item.key)}
            </Link>
          ))}
          <span className={styles.navSpacer} />
          <Link className={styles.navLink} href="/site/random">{t("actionRandom")}</Link>
          <Link className={styles.navLink} href="/desktop">{t("navWorkstation")} <span aria-hidden="true">»</span></Link>
        </div>
      </nav>

      <p className={styles.banner}>
        <span className={styles.bannerLabel}>{t("bannerLabel")}</span>
        <span className={styles.bannerText}>{t("bannerText")}</span>
        <Link href="/site/about">{t("bannerLink")}</Link>
      </p>

      <div className={styles.frame}>
        <nav className={styles.crumbs} aria-label={t("crumbsLabel")}>
          <span>
            {t("crumbRegistry")}
            {trail.map((crumb) => (
              <span key={crumb.label}>
                {" / "}
                {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <strong>{crumb.label}</strong>}
              </span>
            ))}
          </span>
          <span>{t("indexCount", { count: SITE_INDEX.length })}</span>
        </nav>

        {children}
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerRow}>
            <p>{institution("footerRegistry")} <span aria-hidden="true">·</span> {institution("footerService")}</p>
            <p className={styles.footerMeta}>{t("footerEdition")} <span aria-hidden="true">·</span> {t("circularReissue")}</p>
          </div>

          <nav className={styles.footerLinks} aria-label={t("footerLinksLabel")}>
            <Link href="/site">{t("navArchive")}</Link>
            <Link href="/site/records">{t("navRecords")}</Link>
            <Link href="/site/organizations">{t("navOrganizations")}</Link>
            <Link href="/site/about">{t("navAbout")}</Link>
            <Link href="/site/random">{t("randomTitle")}</Link>
            <Link href="/desktop">{t("navWorkstation")}</Link>
            <Link href="/meta/about">{t("aboutSite")}</Link>
            <Link href="/">{t("navPublic")}</Link>
          </nav>

          <p className={styles.footerFine}>
            <span>{t("footerEnd")}</span>
            <a href="#top">{institution("footerTop")}</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
