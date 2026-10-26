import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Building2,
  Clock3,
  FileText,
  LayoutGrid,
  Library,
  Monitor,
  Shuffle,
  TrendingUp,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  ARCHIVE_CLASSES,
  countClass,
  recentFilings,
} from "../browser/archive-index";
import { ArchiveButton } from "./archive-button";
import { ArchiveChrome } from "./archive-chrome";
import {
  CLASS_MESSAGE_KEY,
  ORGANIZATIONS,
  STATUS_MESSAGE_KEY,
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
  const featured =
    SITE_INDEX.find((entry) => entry.code === FEATURED_CODE) ?? SITE_INDEX[0];
  const consulted = mostConsulted(5);

  return (
    <ArchiveChrome active="archive" trail={[]}>
      <main id="site-content" tabIndex={-1} className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroHead}>
            {/*
              No eyebrow here: the breadcrumb directly above already reads
              "Registry / Public archive", and the h1 does not need to be told
              three times before it is read.
            */}
            <h1 className={styles.title}>{t("homeTitle")}</h1>
            <p className={styles.lede}>{t("homeLede")}</p>
          </div>
          <SiteSearch />
          {/*
            The explanation is not part of the query form: it sits under a rule
            as the reading room's own note — the standing copy on the left and
            the caveat in the margin.
          */}
          <div className={styles.heroNotes}>
            <p className={styles.heroIntro}>{t("homeIntro")}</p>
            <p className={styles.heroNote}>{t("homeIntroNote")}</p>
          </div>
        </section>

        <div className={styles.homeGrid}>
          <div className={styles.homeMain}>
            <section className={styles.block} aria-labelledby="featured-title">
              <div className={styles.blockHead}>
                <h2 className={styles.blockTitle} id="featured-title">
                  <FileText size={16} strokeWidth={1.6} aria-hidden="true" />
                  {t("featuredTitle")}
                </h2>
              </div>

              {/*
                The featured record reads as a filed sheet, not as a card: the
                code above the title, the abstract at reading size, and the
                particulars set as a margin column the way a record page sets
                them. The key is the one action on the page with weight.
              */}
              <article className={styles.featured}>
                <div className={styles.featuredBody}>
                  <p
                    className={styles.featuredCode}
                    data-klass={featured.klass}
                  >
                    {featured.code}
                  </p>
                  <h3 className={styles.featuredTitle}>
                    <Link href={`/site/records/${featured.code}`}>
                      {featured.designation ?? featured.code}
                    </Link>
                  </h3>
                  <p className={styles.featuredAbstract}>{featured.abstract}</p>
                  <p className={styles.featuredAction}>
                    <ArchiveButton
                      tone="paper"
                      href={`/site/records/${featured.code}`}
                      icon={
                        <ArrowRight
                          size={13}
                          strokeWidth={1.9}
                          aria-hidden="true"
                        />
                      }
                    >
                      {t("featuredLink")}
                    </ArchiveButton>
                    <span className={styles.featuredNote}>
                      {t("featuredNote")}
                    </span>
                  </p>
                </div>
                <dl className={styles.featuredFacts}>
                  <div>
                    <dt>{t("columnClass")}</dt>
                    <dd>
                      <span
                        className={styles.classTag}
                        data-klass={featured.klass}
                      >
                        {t(CLASS_MESSAGE_KEY[featured.klass])}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt>{t("columnStatus")}</dt>
                    <dd>
                      <span
                        className={styles.statusChip}
                        data-status={featured.status}
                      >
                        {t(STATUS_MESSAGE_KEY[featured.status])}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt>{t("columnFiled")}</dt>
                    <dd className="circa-mono">{featured.filed}</dd>
                  </div>
                  <div>
                    <dt>{t("columnHolder")}</dt>
                    <dd className="circa-mono">{featured.organization}</dd>
                  </div>
                </dl>
              </article>
            </section>

            <section className={styles.block} aria-labelledby="recent-title">
              <div className={styles.blockHead}>
                <h2 className={styles.blockTitle} id="recent-title">
                  <Clock3 size={16} strokeWidth={1.6} aria-hidden="true" />
                  {t("homeLatestTitle")}
                </h2>
                <p className={styles.blockNote}>{t("homeLatestNote")}</p>
              </div>
              <RecordTable
                entries={recentFilings(SITE_INDEX, 5)}
                label={t("homeLatestTitle")}
                compact
              />
            </section>

            <section className={styles.block} aria-labelledby="browse-title">
              <div className={styles.blockHead}>
                <h2 className={styles.blockTitle} id="browse-title">
                  <LayoutGrid size={16} strokeWidth={1.6} aria-hidden="true" />
                  {t("homeBrowseTitle")}
                </h2>
                <p className={styles.blockNote}>{t("homeBrowseNote")}</p>
              </div>
              {/* Four doors, one per class: a strip of index tabs, not a list. */}
              <ul className={styles.classList}>
                {ARCHIVE_CLASSES.map((klass) => (
                  <li key={klass}>
                    <Link
                      className={styles.classLink}
                      href="/site/records"
                      data-klass={klass}
                    >
                      <span className={styles.className}>
                        {t(CLASS_MESSAGE_KEY[klass])}
                      </span>
                      <span className={styles.classCount}>
                        {t("homeCount", { count: countClass(klass) })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className={styles.blockFoot}>
                <span className={styles.count}>
                  {t("homeCount", { count: SITE_INDEX.length })}
                </span>
                <Link className={styles.more} href="/site/records">
                  {t("homeIndexLink")} <span aria-hidden="true">»</span>
                </Link>
              </p>
            </section>
          </div>

          {/*
            The rail is a register, not a stack of cards: each unit is opened by
            a rule and a small heading, so the eye reads one column of entries
            instead of four boxed widgets competing with the featured sheet.
          */}
          <aside className={styles.homeAside} aria-labelledby="register-title">
            <h2 className={styles.railTitle} id="register-title">
              <Library size={16} strokeWidth={1.6} aria-hidden="true" />
              {t("railTitle")}
            </h2>

            <section
              className={styles.railBlock}
              aria-labelledby="popular-title"
            >
              <h3 className={styles.railHeading} id="popular-title">
                <TrendingUp size={13} strokeWidth={1.7} aria-hidden="true" />
                {t("popularTitle")}
              </h3>
              <p className={styles.railNote}>{t("popularNote")}</p>
              <ol className={`${styles.railList} ${styles.railRanked}`}>
                {consulted.map(({ entry, consultations }) => (
                  <li key={entry.code} className={styles.railItem}>
                    <Link href={`/site/records/${entry.code}`}>
                      {entry.designation ?? entry.code}
                    </Link>
                    <span className={styles.railMeta}>
                      {t("popularCount", { count: consultations })}
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <section
              className={styles.railBlock}
              aria-labelledby="random-title"
            >
              <h3 className={styles.railHeading} id="random-title">
                <Shuffle size={13} strokeWidth={1.7} aria-hidden="true" />
                {t("randomTitle")}
              </h3>
              <p className={styles.railNote}>{t("randomNote")}</p>
              <ArchiveButton
                tone="paper"
                className={styles.railAction}
                href="/site/random"
                icon={
                  <Shuffle size={13} strokeWidth={1.9} aria-hidden="true" />
                }
              >
                {t("randomLink")}
              </ArchiveButton>
            </section>

            <section
              className={styles.railBlock}
              aria-labelledby="home-organizations-title"
            >
              <h3 className={styles.railHeading} id="home-organizations-title">
                <Building2 size={13} strokeWidth={1.7} aria-hidden="true" />
                {t("homeOrganizationsTitle")}
              </h3>
              <p className={styles.railNote}>{t("homeOrganizationsNote")}</p>
              <ul className={styles.railList}>
                {ORGANIZATIONS.map((organization) => (
                  <li key={organization.code} className={styles.railItem}>
                    <Link href={`/site/records/${organization.code}`}>
                      {organization.designation ?? t("withheldDesignation")}
                    </Link>
                    <span className={styles.railMeta}>
                      {t("orgFilings", {
                        count: filingsFor(organization.code),
                      })}
                    </span>
                  </li>
                ))}
              </ul>
              <p className={styles.railFoot}>
                <Link className={styles.more} href="/site/organizations">
                  {t("navOrganizations")} <span aria-hidden="true">»</span>
                </Link>
              </p>
            </section>

            <section
              className={styles.railBlock}
              aria-labelledby="home-workstation-title"
            >
              <h3 className={styles.railHeading} id="home-workstation-title">
                <Monitor size={13} strokeWidth={1.7} aria-hidden="true" />
                {t("homeWorkstationTitle")}
              </h3>
              <p className={styles.railNote}>{t("homeWorkstationNote")}</p>
              <p className={styles.railFoot}>
                <Link className={styles.more} href="/desktop">
                  {t("homeWorkstationLink")} <span aria-hidden="true">»</span>
                </Link>
              </p>
            </section>
          </aside>
        </div>
      </main>
    </ArchiveChrome>
  );
}
