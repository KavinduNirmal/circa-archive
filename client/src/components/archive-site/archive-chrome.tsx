import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "../language-switcher";
import { SessionAccessLink } from "../auth/session-access-link";
import { ArchiveNavDropdown } from "./archive-nav-dropdown";
import { PROJECT_LINKS } from "../meta/meta-links";
import { ArchiveButton } from "./archive-button";
import { ArchiveFooter } from "./archive-footer";
import { SiteSearch } from "./site-search";
import styles from "./archive-site.module.css";
import type { SearchState } from "@/lib/search/contract";

/**
 * The public archive's frame.
 *
 * A full-page reading site, not the agency's portal: the masthead carries the
 * search box on every page, the section bar carries the archive's own
 * destinations, and a site notice runs under it. The frame is full-bleed and
 * only its inner measure is constrained, which is what separates a tool from a
 * notice board.
 *
 * About dropdowns connect the reading edition to its author guidance and the
 * project resources. The surrounding chrome speaks as the Commission.
 */

export type ArchiveSection =
  "archive" | "records" | "organizations" | "characters" | "about" | "editor";

export type ArchiveCrumb = { label: string; href?: string };

const NAV: readonly { section: ArchiveSection; key: string; href: string }[] = [
  { section: "archive", key: "navArchive", href: "/site" },
];

export function ArchiveChrome({
  active,
  trail,
  children,
  compact = false,
  searchValues,
}: {
  active: ArchiveSection;
  trail: readonly ArchiveCrumb[];
  children: React.ReactNode;
  compact?: boolean;
  searchValues?: SearchState;
}) {
  const t = useTranslations("site");
  const editorWriteLabel = t("writeTitle");
  // The institution's motto, borrowed from the public portal, and its service line.
  const institution = useTranslations("landing");

  return (
    <div className={styles.shell} id="top">
      <a className={styles.skip} href="#site-content">
        {t("skip")}
      </a>

      {/*
        The classification notice sits above the masthead, so it is the first
        thing a reader meets: white stock, the seal struck into it as a
        watermark, and the warning in the one crimson the archive reserves for
        a holding. It is a printed notice, not a dialog — nothing to dismiss.
      */}
      {!compact && (
        <aside className={styles.classified} aria-label={t("classifiedLabel")}>
          <div className={styles.classifiedInner}>
            <p className={styles.classifiedLead}>{t("classifiedLead")}</p>
            <p className={styles.classifiedMark}>{t("classifiedMark")}</p>
            <p className={styles.classifiedFoot}>{t("classifiedFoot")}</p>
          </div>
        </aside>
      )}

      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Link className={styles.brand} href="/site">
            {/*
              The seal is the SVG used as a mask; the anchor's own colour is its
              paint. So the mark is the same blue as the wordmark beside it,
              brightens with it on hover, and needs no light plate behind it.
            */}
            <span className={styles.brandMark} aria-hidden="true" />
            <span className={styles.brandText}>
              <strong>{t("brandName")}</strong>
              <small>{institution("motto")}</small>
            </span>
          </Link>

          <SiteSearch variant="masthead" values={searchValues} />

          <div className={styles.topbarTools}>
            <LanguageSwitcher className={styles.language} />
            <SessionAccessLink />
          </div>
        </div>
      </header>

      <nav className={styles.nav} aria-label={t("navLabel")}>
        <div className={styles.navInner}>
          {NAV.map((item) => (
            <ArchiveButton
              key={item.section}
              href={item.href}
              current={item.section === active}
            >
              {t(item.key)}
            </ArchiveButton>
          ))}
          <ArchiveNavDropdown
            label={t("navRecords")}
            href="/site/records"
            current={active === "records"}
            items={[
              {
                label: t("navRecordIncidents"),
                href: "/site/records/incidents",
              },
              {
                label: t("navRecordExplorations"),
                href: "/site/records/explorations",
              },
              {
                label: t("navRecordEvidence"),
                href: "/site/records/evidence",
              },
              {
                label: t("navRecordRumours"),
                href: "/site/records/rumours",
              },
              {
                label: t("navRecordPlaylists"),
                href: "/site/records/playlists",
              },
            ]}
          />
          <ArchiveNavDropdown
            label={t("navEntities")}
            href="/site/organizations"
            current={active === "organizations" || active === "characters"}
            items={[
              {
                label: t("navOrganizations"),
                href: "/site/organizations",
              },
              {
                label: t("navCharacters"),
                href: "/site/characters",
              },
            ]}
          />
          <ArchiveNavDropdown
            label={t("navAbout")}
            href="/site/about"
            current={active === "about"}
            items={[
              {
                label: t("navRules"),
                href: "/meta/documentation/author-guide#conduct-assessment-and-appeals",
              },
              {
                label: t("navContentWarnings"),
                href: "/meta/documentation/author-guide#content-warnings-and-access",
              },
              {
                label: t("navGuidelines"),
                href: "/meta/documentation/author-guide",
              },
              { label: t("navFilings"), href: "/site/records" },
            ]}
          />
          <ArchiveNavDropdown
            label={t("aboutSite")}
            href="/meta"
            items={[
              {
                label: t("navSponsor"),
                href: PROJECT_LINKS.sponsor,
                external: true,
              },
              {
                label: t("navGithub"),
                href: PROJECT_LINKS.repository,
                external: true,
              },
              { label: t("navDocumentation"), href: "/meta/documentation" },
              { label: t("navLore"), href: "/meta/documentation/lore" },
              { label: t("navTos"), href: "/meta/about#licence" },
            ]}
          />
          <ArchiveButton href="/site/write" current={active === "editor"}>
            {editorWriteLabel}
          </ArchiveButton>
          <span className={styles.navSpacer} />
          <ArchiveButton href="/site/random">{t("actionRandom")}</ArchiveButton>
          <ArchiveButton href="/desktop">
            {t("navWorkstation")} <span aria-hidden="true">»</span>
          </ArchiveButton>
        </div>
      </nav>

      {/* The announcement remains a static, readable notice in both languages. */}
      {!compact && (
        <aside className={styles.banner} aria-label={t("bannerLabel")}>
          <div className={styles.bannerInner}>
            <span className={styles.bannerLabel}>{t("bannerLabel")}</span>
            <div className={styles.bannerTicker}>
              <div className={styles.bannerTrack}>
                <span className={styles.bannerText}>{t("bannerText")}</span>
              </div>
            </div>
            <div className={styles.bannerTools}>
              <ArchiveButton href="/site/about" className={styles.bannerKey}>
                {t("bannerLink")}
              </ArchiveButton>
            </div>
          </div>
        </aside>
      )}

      <div className={styles.frame}>
        <nav className={styles.crumbs} aria-label={t("crumbsLabel")}>
          <span>
            {t("crumbRegistry")}
            {trail.map((crumb) => (
              <span key={crumb.label}>
                {" / "}
                {crumb.href ? (
                  <Link href={crumb.href}>{crumb.label}</Link>
                ) : (
                  <strong>{crumb.label}</strong>
                )}
              </span>
            ))}
          </span>
          {/*
            No count here. Every route used to print the index total in this
            slot, so the writing desk and the reading guide appeared to have
            eighteen entries, and the records index printed it beside its own
            result count. The pages that hold a total already state it.
          */}
        </nav>

        {children}
      </div>

      {!compact && <ArchiveFooter />}
    </div>
  );
}
