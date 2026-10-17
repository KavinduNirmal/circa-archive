import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ARCHIVE_CLASSES, countClass, recentFilings } from "../browser/archive-index";
import { ArchiveChrome } from "./archive-chrome";
import {
  CLASS_MESSAGE_KEY,
  ORGANIZATIONS,
  SITE_INDEX,
  filingsFor,
  mostConsulted,
} from "./archive-data";
import { RecordTable } from "./archive-records";
import { SiteSearch } from "./site-search";
import styles from "./archive-site.module.css";

/**
 * The archive's front page.
 *
 * The search comes first because that is how a reader arrives at an archive:
 * with a code, a name, or half a sentence. The rest of the page is the reading
 * room's own furniture — one featured record, what was filed recently, what is
 * being consulted, and a door that opens something at random.
 */
const FEATURED_CODE = "CIRCA-S-03007";

export function ArchiveHome() {
  const t = useTranslations("site");
  const featured = SITE_INDEX.find((entry) => entry.code === FEATURED_CODE) ?? SITE_INDEX[0];
  const consulted = mostConsulted(5);

  return (
    <ArchiveChrome active="archive" trail={[]}>
      <main id="site-content" tabIndex={-1} className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.kicker}>{t("crumbRegistry")}</p>
          <h1 className={styles.title}>{t("homeTitle")}</h1>
          <p className={styles.lede}>{t("homeLede")}</p>
          <SiteSearch large />
          <p className={styles.body}>{t("homeIntro")}</p>
          <p className={styles.note}>{t("homeIntroNote")}</p>
        </section>

        <div className={styles.homeGrid}>
          <div className={styles.homeMain}>
            <section className={styles.block} aria-labelledby="featured-title">
              <h2 className={styles.blockTitle} id="featured-title">{t("featuredTitle")}</h2>
              <div className={styles.panel}>
                <h3 className={styles.panelTitle}>
                  <Link href={`/site/records/${featured.code}`}>{featured.designation ?? featured.code}</Link>
                </h3>
                <p className={styles.panelBody}>{featured.abstract}</p>
                <p className={styles.panelFoot}>
                  <span className={styles.count}>{featured.code} · {featured.filed}</span>
                  <Link className={styles.more} href={`/site/records/${featured.code}`}>
                    {t("featuredLink")} <span aria-hidden="true">»</span>
                  </Link>
                </p>
              </div>
              <p className={styles.note}>{t("featuredNote")}</p>
            </section>

            <section className={styles.block} aria-labelledby="recent-title">
              <h2 className={styles.blockTitle} id="recent-title">{t("homeLatestTitle")}</h2>
              <p className={styles.note}>{t("homeLatestNote")}</p>
              <RecordTable entries={recentFilings(SITE_INDEX, 5)} label={t("homeLatestTitle")} compact />
            </section>

            <section className={styles.block} aria-labelledby="browse-title">
              <h2 className={styles.blockTitle} id="browse-title">{t("homeBrowseTitle")}</h2>
              <p className={styles.note}>{t("homeBrowseNote")}</p>
              <ul className={styles.classList}>
                {ARCHIVE_CLASSES.map((klass) => (
                  <li key={klass}>
                    <Link href="/site/records">{t(CLASS_MESSAGE_KEY[klass])}</Link>
                    <span className={styles.classListCount}>{t("homeCount", { count: countClass(klass) })}</span>
                  </li>
                ))}
              </ul>
              <p className={styles.panelFoot}>
                <span className={styles.count}>{t("homeCount", { count: SITE_INDEX.length })}</span>
                <Link className={styles.more} href="/site/records">
                  {t("homeIndexLink")} <span aria-hidden="true">»</span>
                </Link>
              </p>
            </section>
          </div>

          <aside className={styles.homeAside}>
            <section className={styles.panel} aria-labelledby="popular-title">
              <h2 className={styles.panelTitle} id="popular-title">{t("popularTitle")}</h2>
              <p className={styles.panelNote}>{t("popularNote")}</p>
              <ol className={styles.popularList}>
                {consulted.map(({ entry, consultations }) => (
                  <li key={entry.code} className={styles.popularItem}>
                    <Link href={`/site/records/${entry.code}`}>{entry.designation ?? entry.code}</Link>
                    <span className={styles.popularCount}>{t("popularCount", { count: consultations })}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section className={styles.panel} aria-labelledby="random-title">
              <h2 className={styles.panelTitle} id="random-title">{t("randomTitle")}</h2>
              <p className={styles.panelBody}>{t("randomNote")}</p>
              <Link className={styles.randomButton} href="/site/random">
                {t("randomLink")} <span aria-hidden="true">»</span>
              </Link>
            </section>

            <section className={styles.panel} aria-labelledby="home-organizations-title">
              <h2 className={styles.panelTitle} id="home-organizations-title">{t("homeOrganizationsTitle")}</h2>
              <p className={styles.panelNote}>{t("homeOrganizationsNote")}</p>
              <ul className={styles.asList}>
                {ORGANIZATIONS.map((organization) => (
                  <li key={organization.code}>
                    <Link href={`/site/records/${organization.code}`}>{organization.designation ?? t("withheldDesignation")}</Link>
                    <span className={styles.asideMeta}>{t("orgFilings", { count: filingsFor(organization.code) })}</span>
                  </li>
                ))}
              </ul>
              <p className={styles.panelFoot}>
                <Link className={styles.more} href="/site/organizations">{t("navOrganizations")} <span aria-hidden="true">»</span></Link>
              </p>
            </section>

            <section className={styles.panel} aria-labelledby="home-workstation-title">
              <h2 className={styles.panelTitle} id="home-workstation-title">{t("homeWorkstationTitle")}</h2>
              <p className={styles.panelBody}>{t("homeWorkstationNote")}</p>
              <p className={styles.panelFoot}>
                <Link className={styles.more} href="/desktop">{t("homeWorkstationLink")} <span aria-hidden="true">»</span></Link>
              </p>
            </section>
          </aside>
        </div>
      </main>
    </ArchiveChrome>
  );
}
