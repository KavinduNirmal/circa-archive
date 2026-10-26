import { useTranslations } from "next-intl";
import { BookOpen, Monitor } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  ARCHIVE_CLASSES,
  ARCHIVE_INDEX,
  ARCHIVE_STATUSES,
} from "../browser/archive-index";
import { ArchiveChrome } from "./archive-chrome";
import { ArchiveButton } from "./archive-button";
import { CLASS_MESSAGE_KEY, STATUS_MESSAGE_KEY } from "./archive-data";
import styles from "./archive-site.module.css";

/**
 * The reading guide: what this edition is, and how to read its words.
 *
 * It is set as a leaf of the archive's own prose rather than as a help page,
 * because that is what it is — a printed guide handed over with the index. The
 * classes and statuses are not described in the abstract: each one names a real
 * code from the index and links to the index filtered by it, so a reader can go
 * from "what does sealed withhold" to the sealed records in one move.
 *
 * The numbering in the sheet's margin, the registers, and the ruled margin of
 * facts are the record page's own furniture, so a reader who has opened a record
 * already knows how to read this page.
 */

const SECTIONS = [
  { id: "using", labelKey: "aboutUseTitle" },
  { id: "classes", labelKey: "aboutClassesTitle" },
  { id: "statuses", labelKey: "aboutStatusesTitle" },
  { id: "clearance", labelKey: "aboutClearanceTitle" },
  { id: "workstation", labelKey: "aboutWorkstationTitle" },
] as const;

export function ArchiveAbout() {
  const t = useTranslations("site");

  const classBody: Record<string, string> = {
    classIncident: t("aboutClassIncidentBody"),
    classOrganization: t("aboutClassOrganizationBody"),
    classExploration: t("aboutClassExplorationBody"),
    classEvidence: t("aboutClassEvidenceBody"),
  };

  const statusBody: Record<string, string> = {
    statusOnFile: t("aboutStatusOnFileBody"),
    statusContested: t("aboutStatusContestedBody"),
    statusSealed: t("aboutStatusSealedBody"),
    statusRestricted: t("aboutStatusRestrictedBody"),
    statusErased: t("aboutStatusErasedBody"),
  };

  const organizations = ARCHIVE_INDEX.filter(
    (entry) => entry.klass === "organization",
  ).length;

  /** One released code per class, so the key points at something a reader can open. */
  const sampleFor = (klass: string) =>
    ARCHIVE_INDEX.find((entry) => entry.klass === klass)?.code;

  return (
    <ArchiveChrome active="about" trail={[{ label: t("trailAbout") }]}>
      <main id="site-content" tabIndex={-1} className={styles.guideLayout}>
        <article className={styles.guide}>
          <header className={styles.guideHead}>
            <p className={styles.kicker}>{t("aboutKicker")}</p>
            <h1 className={styles.guideTitle}>{t("aboutTitle")}</h1>
            <p className={styles.guideLede}>{t("aboutLede")}</p>
            <p className={styles.guideIntro}>{t("aboutBody")}</p>
          </header>

          <div className={styles.sheet}>
            <section
              className={styles.sheetSection}
              id="using"
              aria-labelledby="using-title"
            >
              <h2 className={styles.sheetHeading} id="using-title">
                <span className={styles.sectionIndex} aria-hidden="true">
                  01
                </span>
                {t("aboutUseTitle")}
              </h2>
              <p className={styles.guideBody}>{t("aboutUseBody")}</p>
            </section>

            {/*
              The classes are a colour key as much as a glossary: the same crimson,
              steel, teal and ochre a reader meets on a code in the index. The name
              links to the index filtered by that class, and the sample code is a
              real entry, so the key can be tested rather than believed.
            */}
            <section
              className={styles.sheetSection}
              id="classes"
              aria-labelledby="classes-title"
            >
              <h2 className={styles.sheetHeading} id="classes-title">
                <span className={styles.sectionIndex} aria-hidden="true">
                  02
                </span>
                {t("aboutClassesTitle")}
              </h2>
              <table className={styles.keyTable} data-key="classes">
                <thead>
                  <tr>
                    <th scope="col">{t("aboutClassColumn")}</th>
                    <th scope="col">{t("aboutDefinesColumn")}</th>
                  </tr>
                </thead>
                <tbody>
                  {ARCHIVE_CLASSES.map((klass) => (
                    <tr key={klass} data-klass={klass}>
                      <th scope="row">
                        <Link
                          className={styles.keyClass}
                          href={`/site/records?class=${klass}`}
                        >
                          {t(CLASS_MESSAGE_KEY[klass])}
                        </Link>
                        <span className={styles.keyCode}>
                          {sampleFor(klass) ?? "—"}
                        </span>
                      </th>
                      <td>{classBody[CLASS_MESSAGE_KEY[klass]]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className={styles.guideHint}>{t("aboutKeyHint")}</p>
              <p className={styles.guideHint}>{t("aboutRumourHint")}</p>
            </section>

            <section
              className={styles.sheetSection}
              id="statuses"
              aria-labelledby="statuses-title"
            >
              <h2 className={styles.sheetHeading} id="statuses-title">
                <span className={styles.sectionIndex} aria-hidden="true">
                  03
                </span>
                {t("aboutStatusesTitle")}
              </h2>
              <table className={styles.keyTable} data-key="statuses">
                <thead>
                  <tr>
                    <th scope="col">{t("aboutStatusColumn")}</th>
                    <th scope="col">{t("aboutMeansColumn")}</th>
                  </tr>
                </thead>
                <tbody>
                  {ARCHIVE_STATUSES.map((status) => (
                    <tr key={status}>
                      <th scope="row">
                        <Link
                          className={`${styles.statusChip} ${styles.keyStatus}`}
                          data-status={status}
                          href={`/site/records?status=${status}`}
                        >
                          {t(STATUS_MESSAGE_KEY[status])}
                        </Link>
                      </th>
                      <td>{statusBody[STATUS_MESSAGE_KEY[status]]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className={styles.guideHint}>{t("aboutStatusHint")}</p>
            </section>

            <section
              className={styles.sheetSection}
              id="clearance"
              aria-labelledby="clearance-title"
            >
              <h2 className={styles.sheetHeading} id="clearance-title">
                <span className={styles.sectionIndex} aria-hidden="true">
                  04
                </span>
                {t("aboutClearanceTitle")}
              </h2>
              <p className={styles.guideNote}>{t("aboutClearanceBody")}</p>
            </section>

            <section
              className={styles.sheetSection}
              id="workstation"
              aria-labelledby="workstation-title"
            >
              <h2 className={styles.sheetHeading} id="workstation-title">
                <span className={styles.sectionIndex} aria-hidden="true">
                  05
                </span>
                {t("aboutWorkstationTitle")}
              </h2>
              <p className={styles.guideBody}>{t("aboutWorkstationBody")}</p>
              <p className={styles.guideActions}>
                <ArchiveButton
                  tone="paper"
                  href="/desktop"
                  icon={<Monitor aria-hidden size={12} />}
                >
                  {t("aboutWorkstationLink")}
                </ArchiveButton>
                <ArchiveButton
                  tone="paper"
                  href="/"
                  icon={<BookOpen aria-hidden size={12} />}
                >
                  {t("aboutPublicLink")}
                </ArchiveButton>
              </p>
            </section>
          </div>
        </article>

        <aside className={styles.recordAside}>
          <section
            className={`${styles.asideBlock} ${styles.guideContents}`}
            aria-labelledby="guide-contents"
          >
            <h2 className={styles.asideTitle} id="guide-contents">
              {t("aboutContentsTitle")}
            </h2>
            <ol className={styles.guideToc}>
              {SECTIONS.map((section, position) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>
                    <span className={styles.tocIndex} aria-hidden="true">
                      {String(position + 1).padStart(2, "0")}
                    </span>
                    {t(section.labelKey)}
                  </a>
                </li>
              ))}
            </ol>
          </section>

          <section
            className={styles.asideBlock}
            aria-labelledby="edition-title"
          >
            <h2 className={styles.asideTitle} id="edition-title">
              {t("aboutEditionTitle")}
            </h2>
            <dl className={styles.particulars}>
              <div>
                <dt>{t("aboutEditionEntries")}</dt>
                <dd className="circa-mono">{ARCHIVE_INDEX.length}</dd>
              </div>
              <div>
                <dt>{t("aboutEditionOrganizations")}</dt>
                <dd className="circa-mono">{organizations}</dd>
              </div>
              <div>
                <dt>{t("aboutEditionClasses")}</dt>
                <dd className="circa-mono">{ARCHIVE_CLASSES.length}</dd>
              </div>
              <div>
                <dt>{t("aboutEditionStatuses")}</dt>
                <dd className="circa-mono">{ARCHIVE_STATUSES.length}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </main>
    </ArchiveChrome>
  );
}
