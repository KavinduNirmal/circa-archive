import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ARCHIVE_CLASSES, ARCHIVE_STATUSES } from "../browser/archive-index";
import { ArchiveChrome } from "./archive-chrome";
import { CLASS_MESSAGE_KEY, STATUS_MESSAGE_KEY } from "./archive-data";
import styles from "./archive-site.module.css";

/**
 * What the plain edition is, and how to read its words.
 *
 * The classes and statuses are printed with their definitions here rather than
 * only where they are used, because an index is only as readable as its
 * vocabulary: a reader who does not know what "sealed" withholds cannot tell a
 * held filing from a missing one.
 */
export function ArchiveAbout() {
  const t = useTranslations("site");

  const classBody: Record<string, string> = {
    classIncident: t("aboutClassIncidentBody"),
    classOrganization: t("aboutClassOrganizationBody"),
    classContinuity: t("aboutClassContinuityBody"),
    classMemo: t("aboutClassMemoBody"),
  };

  const statusBody: Record<string, string> = {
    statusOnFile: t("aboutStatusOnFileBody"),
    statusContested: t("aboutStatusContestedBody"),
    statusSealed: t("aboutStatusSealedBody"),
    statusRestricted: t("aboutStatusRestrictedBody"),
    statusErased: t("aboutStatusErasedBody"),
  };

  return (
    <ArchiveChrome active="about" trail={[{ label: t("trailAbout") }]}>
      <main id="site-content" tabIndex={-1} className={styles.page}>
        <header className={styles.pageHead}>
          <p className={styles.kicker}>{t("crumbRegistry")}</p>
          <h1 className={styles.title}>{t("aboutTitle")}</h1>
          <p className={styles.lede}>{t("aboutLede")}</p>
          <p className={styles.body}>{t("aboutBody")}</p>
        </header>

        <div className={styles.aboutGrid}>
          <section className={styles.block} aria-labelledby="use-title">
            <h2 className={styles.blockTitle} id="use-title">{t("aboutUseTitle")}</h2>
            <p className={styles.body}>{t("aboutUseBody")}</p>
          </section>

          <div className={styles.aboutPair}>
            <section className={styles.block} aria-labelledby="classes-title">
              <h2 className={styles.blockTitle} id="classes-title">{t("aboutClassesTitle")}</h2>
              <dl className={styles.glossary}>
                {ARCHIVE_CLASSES.map((klass) => (
                  <div key={klass}>
                    <dt>{t(CLASS_MESSAGE_KEY[klass])}</dt>
                    <dd>{classBody[CLASS_MESSAGE_KEY[klass]]}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className={styles.block} aria-labelledby="statuses-title">
              <h2 className={styles.blockTitle} id="statuses-title">{t("aboutStatusesTitle")}</h2>
              <dl className={styles.glossary}>
                {ARCHIVE_STATUSES.map((status) => (
                  <div key={status}>
                    <dt>{t(STATUS_MESSAGE_KEY[status])}</dt>
                    <dd>{statusBody[STATUS_MESSAGE_KEY[status]]}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          <div className={styles.aboutPair}>
            <section className={styles.block} aria-labelledby="clearance-title">
              <h2 className={styles.blockTitle} id="clearance-title">{t("aboutClearanceTitle")}</h2>
              <p className={styles.body}>{t("aboutClearanceBody")}</p>
            </section>

            <section className={styles.block} aria-labelledby="workstation-title">
              <h2 className={styles.blockTitle} id="workstation-title">{t("aboutWorkstationTitle")}</h2>
              <p className={styles.body}>{t("aboutWorkstationBody")}</p>
              <p className={styles.linkRow}>
                <Link href="/desktop">{t("aboutWorkstationLink")} <span aria-hidden="true">»</span></Link>
                <Link href="/">{t("aboutPublicLink")} <span aria-hidden="true">»</span></Link>
              </p>
            </section>
          </div>
        </div>
      </main>
    </ArchiveChrome>
  );
}
