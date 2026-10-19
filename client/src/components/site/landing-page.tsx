import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "../language-switcher";
import { SessionAccessLink } from "../auth/session-access-link";
import { Attendance, PortalSigns, RegisterRefresh, UnavailableLink } from "./portal-signs";
import styles from "./landing-page.module.css";

/**
 * The public portal: an agency site that has been left running.
 *
 * This is a Server Component, so every sentence is rendered before it reaches the
 * browser; the `landing` catalog is never sent to the client. Four small client
 * components sit inside the page — the sentences that change, the visit counter,
 * the refreshable register, and the pages the site lists but does not hold — and
 * each of them receives its copy as a prop.
 *
 * The page stays in the Commission's voice from top to bottom, including its
 * navigation: there is no out-of-character banner, because the meta layer is
 * meant to be legible from the page's structure and from where the archive link
 * leads, not announced above the masthead.
 */

/** Directory rows, in reading order. Numbers and anchors are structural, not copy. */
const directory = [
  ["01", "publicAccess", "public-access"],
  ["02", "submissions", "submissions"],
  ["03", "organizations", "organizations"],
  ["04", "credentials", "credentials"],
] as const;

/**
 * The five alterations on the page, as offsets in milliseconds.
 *
 * They are staggered far apart on purpose. Two sentences changing at once reads
 * as an effect; one changing while the reader is somewhere else is the uncanny
 * thing the brief asks for. The last of them fires almost a minute in, so a
 * reader who only skims the top of the page never sees it.
 */
const ALTER_ACCESS_MS = 17000;
const ALTER_NOTICE_MS = 6000;
const ALTER_VISITS_MS = 26000;
const ALTER_HOURS_MS = 34000;
const ALTER_FOOTER_MS = 45000;

function Procedure({ id, number, title, children }: {
  id: string; number: string; title: string; children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={styles.procedure}>
      <h2 id={`${id}-title`}><span>{number}</span> {title}</h2>
      {children}
    </section>
  );
}

export function LandingPage() {
  const t = useTranslations("landing");

  return (
    <div className={styles.portal} id="top">
      <a className={styles.skip} href="#public-access">{t("skipToAccess")}</a>
      <div className={styles.site}>
        <div className={styles.utility}>
          <span className={styles.utilityService}>{t("utilityService")}</span>
          <span className={styles.utilityEdition}>{t("utilityEdition")} <a href="#accessibility">{t("utilityAssistance")}</a></span>
          <span className={styles.utilityTerminal}>{t("utilityTerminal")}</span>
          <LanguageSwitcher className={styles.utilityLanguage} />
        </div>

        <header className={styles.masthead}>
          <div className={styles.seal} aria-hidden="true">
            {/* The Commission's mark, supplied as SVG: a printed logo pasted into the banner. */}
            <Image className={styles.sealLogo} src="/circa_full_logo.svg" alt="" width={92} height={100} draggable={false} unoptimized />
          </div>
          <div className={styles.mastheadCopy}>
            <p className={styles.eyebrow}>{t("eyebrow")}</p>
            <h1>{t("agencyLineOne")}<br />{t("agencyLineTwo")}</h1>
            <p className={styles.motto}>{t("motto")}</p>
          </div>
          <div className={styles.circular}>
            <span>{t("circularLabel")}</span>
            <strong>{t("circularNumber")}</strong>
            <span className={styles.circularStatus}>{t("circularStatus")}</span>
            <span className={styles.circularReissue}>{t("circularReissue")}</span>
          </div>
        </header>

        <nav className={styles.topnav} aria-label={t("navLabel")}>
          <a href="#public-access" aria-current="page">{t("navHome")}</a>
          <a href="#about">{t("navAbout")}</a>
          <a href="#documents">{t("navDocuments")}</a>
          <a href="#contacts">{t("navContacts")}</a>
          <a href="#notices">{t("navNotices")}</a>
          <SessionAccessLink variant="portal" className={styles.topnavAccess} />
        </nav>

        <div className={styles.crumbs}>
          <span>{t("breadcrumbTrail")} <strong>{t("breadcrumbIndex")}</strong></span>
          <span>{t("documentStatus")} <b>{t("documentCurrent")}</b> · {t("documentCopy")}</span>
        </div>

        <div className={styles.layout}>
          <aside className={styles.rail} aria-label={t("railLabel")}>
            <nav className={styles.directory} aria-label={t("directoryLabel")}>
              <h2 className={styles.boxTitle}>{t("directoryTitle")}</h2>
              <ol className={styles.directoryList}>
                {directory.map(([number, key, id]) => (
                  <li key={id}>
                    <a href={`#${id}`}><span className={styles.directoryNumber}>{number}</span>{t(key)}</a>
                  </li>
                ))}
                <li>
                  <a href="#notices"><span className={styles.directoryNumber}>05</span>{t("directoryNotices")}</a>
                </li>
              </ol>
            </nav>

            <section className={styles.box} aria-labelledby="closed-title">
              <h2 className={styles.boxTitle} id="closed-title">{t("closedTitle")}</h2>
              <p className={styles.boxNote}>{t("closedIntro")}</p>
              <ul className={styles.closedList}>
                {[
                  ["closedPlan", "closedPlanBody", "closedPlanRef"],
                  ["closedGuest", "closedGuestBody", "closedGuestRef"],
                  ["closedCircular", "closedCircularBody", "closedCircularRef"],
                  ["closedPersonnel", "closedPersonnelBody", "closedPersonnelRef"],
                ].map(([label, body, reference]) => (
                  <li key={label}>
                    <UnavailableLink
                      label={t(label)}
                      dialogTitle={t("closedDialogTitle")}
                      heading={t("closedDialogHeading")}
                      body={t(body)}
                      detail={t(reference)}
                    />
                  </li>
                ))}
              </ul>
              <p className={styles.closedFoot}>{t("closedFootnote")}</p>
            </section>

            <section className={styles.box} aria-labelledby="hours-title">
              <h2 className={styles.boxTitle} id="hours-title">{t("hoursTitle")}</h2>
              <p className={styles.hours}>{t("hoursDays")}<br />{t("hoursTimes")}</p>
              <p className={styles.boxNote}>{t("hoursNote")}</p>
              <p className={styles.boxNote} data-alter={t("hoursAddendumAlter")} data-alter-after={ALTER_HOURS_MS} data-alter-hold="1500">
                {t("hoursAddendum")}
              </p>
            </section>

            <section className={styles.box} aria-labelledby="clearance-title">
              <h2 className={styles.boxTitle} id="clearance-title">{t("clearanceTitle")}</h2>
              <dl className={styles.clearance}>
                <div><dt>{t("clearancePublicTerm")}</dt><dd>{t("clearancePublicText")}</dd></div>
                <div><dt>{t("clearanceReviewerTerm")}</dt><dd>{t("clearanceReviewerText")}</dd></div>
                <div><dt>{t("clearanceRestrictedTerm")}</dt><dd>{t("clearanceRestrictedText")}</dd></div>
              </dl>
              <p className={styles.boxNote}>{t("clearanceNote")}</p>
            </section>

            <div className={styles.stamp} role="note" aria-label={t("stampLabel")}>
              {t("stampSheet")}<br /><strong>{t("stampCount")}</strong><br />{t("stampRetain")}
            </div>

            <div className={styles.received} role="note" aria-label={t("receivedLabel")}>
              <span>{t("receivedTop")}</span>
              <span>{t("receivedDate")}</span>
              <span>{t("receivedRoom")}</span>
            </div>

            <p className={styles.railFoot}>
              {t("sidebarFootMaintained")}<br />{t("sidebarFootOffice")}{" "}
              <span className={styles.redaction} aria-label={t("redactionLabel")}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
              <br />{t("sidebarFootRoom")}
            </p>
          </aside>

          <main id="public-access" tabIndex={-1} aria-labelledby="public-access-title" className={styles.main}>
            <div className={styles.docHead}><span>{t("accessCode")}</span><span>{t("accessRetain")}</span></div>
            <h2 id="public-access-title" className={styles.pageTitle}>{t("accessTitle")}</h2>
            <p className={styles.intro}>{t("accessIntro")}</p>
            <p data-alter={t("accessAlter")} data-alter-after={ALTER_ACCESS_MS}>{t("accessBody")}</p>
            <p className={styles.aside}>{t("accessAbsence")}</p>

            <div className={styles.entry}>
              <div className={styles.entryBody}>
                <div className={styles.entryActions}>
                  <Link href="/desktop" className={styles.enter}>
                    <span>{t("enterArchive")}</span><span aria-hidden="true">»</span>
                  </Link>
                  <Link href="/site" className={styles.enterSecondary}>
                    <span>{t("enterPublicSite")}</span><span aria-hidden="true">»</span>
                  </Link>
                </div>
                <p className={styles.entryNote}>{t("enterNote")}</p>
              </div>
              <span className={styles.entryCode}>{t("accessPoint")}<br />{t("readingRoom")}</span>
            </div>

            <p className={styles.firstVisit}>
              {t.rich("firstVisit", {
                strong: (chunks) => <strong>{chunks}</strong>,
                b: (chunks) => <b>{chunks}</b>,
              })}
            </p>

            <div className={styles.notice}>
              <strong className={styles.noticeHeading}>{t("noticeHeading")}</strong>
              <p className={styles.noticeBody}>
                <span data-alter={t("noticeAlter")} data-alter-after={ALTER_NOTICE_MS}>{t("noticeBody")}</span>
              </p>
              <p className={styles.noticePostscript}>{t("noticePostscript")}</p>
              <span className={styles.noticeSource}>{t("noticeSource")}</span>
            </div>

            <nav className={styles.mobileDirectory} aria-label={t("procedureShortcuts")}>
              <a href="#submissions">{t("submissions")}</a>
              <a href="#organizations">{t("organizations")}</a>
              <a href="#credentials">{t("credentials")}</a>
            </nav>

            <Procedure id="submissions" number="02" title={t("submissions")}>
              <p>{t("submissionsBody")}</p>
              <ol className={styles.steps}>
                <li>{t("submissionsStepOne")}</li>
                <li>{t("submissionsStepTwo")}</li>
                <li>{t("submissionsStepThree")}</li>
                <li>{t("submissionsStepFour")}</li>
              </ol>
              <p className={styles.serviceNote}>
                {t.rich("submissionsNotice", { strong: (chunks) => <strong>{chunks}</strong> })}
              </p>
              <details className={styles.disclosure}>
                <summary>{t("submissionsDisclosure")}</summary>
                <div><p>{t("submissionsRuleOne")}</p><p>{t("submissionsRuleTwo")}</p></div>
              </details>
            </Procedure>

            <Procedure id="organizations" number="03" title={t("organizations")}>
              <p>{t("organizationsBody")}</p>
              <dl className={styles.particulars}>
                <div><dt>{t("particularsBriefTerm")}</dt><dd>{t("particularsBriefText")}</dd></div>
                <div><dt>{t("particularsVoiceTerm")}</dt><dd>{t("particularsVoiceText")}</dd></div>
                <div><dt>{t("particularsSeedTerm")}</dt><dd>{t("particularsSeedText")}</dd></div>
              </dl>
              <p>{t("organizationsReview")}</p>
              <p className={styles.serviceNote}>
                {t.rich("organizationsNotice", { b: (chunks) => <b>{chunks}</b> })}
              </p>
            </Procedure>

            <Procedure id="credentials" number="04" title={t("credentials")}>
              <p>{t("credentialsBody")}</p>
              <Link href="/sign-up" className={styles.textLink}>{t("credentialsContinue")} »</Link>
              <p className={styles.small}>{t("credentialsSmall")}</p>
            </Procedure>

            <section id="about" className={styles.about} aria-labelledby="about-title">
              <h2 id="about-title">{t("aboutTitle")}</h2>
              <p>{t("aboutBody")}</p>
              <p className={styles.doctrine}>{t("aboutDoctrine")}</p>
              <p className={styles.aside}>{t("aboutAddendum")}</p>
              <p className={styles.small}>{t("aboutSmall")}</p>
            </section>
          </main>

          <aside className={styles.bulletins} aria-label={t("bulletinsLabel")}>
            <section id="notices" className={styles.box} aria-labelledby="news-title">
              <h2 className={styles.boxTitle} id="news-title">{t("newsTitle")}</h2>
              <RegisterRefresh
                updated={t("newsUpdated")}
                refreshedUpdated={t("newsRefreshedUpdated")}
                refreshLabel={t("newsRefresh")}
                refreshed={t("newsRefreshed")}
              >
                <ol className={styles.newsList}>
                  <li className={styles.newsItem}>
                    <p className={styles.newsMeta}>
                      <span className={styles.newsTag}>{t("newsNewTag")}</span>
                      <time className={styles.newsDate} dateTime="2003-11-14">{t("newsOneDate")}</time>
                    </p>
                    <h3><a href="#documents">{t("newsOneTitle")}</a></h3>
                    <p>{t("newsOneBody")}</p>
                  </li>
                  <li className={styles.newsItem}>
                    <p className={styles.newsMeta}>
                      <time className={styles.newsDate} dateTime="2001-06-08">{t("newsTwoDate")}</time>
                    </p>
                    <h3><a href="#contacts">{t("newsTwoTitle")}</a></h3>
                    <p>{t("newsTwoBody")}</p>
                  </li>
                  <li className={styles.newsItem}>
                    <p className={styles.newsMeta}>
                      <time className={styles.newsDate} dateTime="1999-01-01">{t("newsThreeDate")}</time>
                    </p>
                    <h3>{t("newsThreeTitle")}</h3>
                    <p>{t("newsThreeBody")}</p>
                  </li>
                </ol>
                <p className={styles.newsEnd}>{t("newsEnd")}</p>
              </RegisterRefresh>
            </section>

            <section className={`${styles.box} ${styles.attendanceBox}`} aria-labelledby="attendance-title">
              <h2 className={styles.boxTitle} id="attendance-title">{t("attendanceTitle")}</h2>
              <Attendance
                label={t("attendanceLabel")}
                note={t("attendanceNote")}
                still={t("attendanceStill")}
              />
            </section>

            <section className={styles.box} aria-labelledby="visits-title">
              <h2 className={styles.boxTitle} id="visits-title">{t("visitsTitle")}</h2>
              <div className={styles.visitsBody}>
                <p className={styles.counter}>
                  <span className={styles.counterDigits} aria-hidden="true">
                    {[...t("visitsCount")].map((digit, index) => (
                      <span key={index}>{digit === "," ? "." : digit}</span>
                    ))}
                  </span>
                  <span className="sr-only">{t("visitsCount")}</span>
                </p>
                <p className={styles.visitsNote} data-alter={t("visitsNoteAlter")} data-alter-after={ALTER_VISITS_MS}>
                  {t("visitsNote")}
                </p>
              </div>
            </section>

            <section id="documents" className={styles.box} aria-labelledby="documents-title">
              <h2 className={styles.boxTitle} id="documents-title">{t("documentsTitle")}</h2>
              <ul className={styles.documentList}>
                <li><a href="#public-access">{t("documentOne")}</a><span>{t("documentOneMeta")}</span></li>
                <li><a href="#submissions">{t("documentTwo")}</a><span>{t("documentTwoMeta")}</span></li>
                <li><a href="#organizations">{t("documentThree")}</a><span>{t("documentThreeMeta")}</span></li>
                <li><a href="#withdrawn">{t("documentFour")}</a><span>{t("documentFourMeta")}</span></li>
              </ul>
            </section>

            <section className={styles.box} aria-labelledby="board-title">
              <h2 className={styles.boxTitle} id="board-title">{t("boardTitle")}</h2>
              <ul className={styles.boardList}>
                <li>{t("boardOne")}</li>
                <li>{t("boardTwo")}</li>
                <li>{t("boardThree")}</li>
              </ul>
            </section>

            <section id="withdrawn" className={styles.withdrawn} aria-labelledby="withdrawn-title">
              <h2 id="withdrawn-title">{t("withdrawnTitle")}</h2>
              <p>{t("withdrawnBody")}</p>
            </section>

            <figure className={styles.held}>
              <div className={styles.heldPlate} aria-hidden="true"><span>×</span></div>
              <figcaption>{t("imageNotHeldCaption")}</figcaption>
            </figure>

            <div className={styles.registerMark} aria-hidden="true">{t("registerMark")}<br />{t("registerChecked")}</div>
          </aside>
        </div>

        <div className={styles.registers}>
          <section id="contacts" aria-labelledby="contacts-title">
            <h2 id="contacts-title">{t("contactsTitle")}</h2>
            <table aria-label={t("contactsLabel")}>
              <thead><tr><th scope="col">{t("contactsEnquiries")}</th><th scope="col">{t("contactsRefer")}</th><th scope="col">{t("contactsRoom")}</th></tr></thead>
              <tbody>
                <tr><th scope="row">{t("contactsPublic")}</th><td><a href="#public-access">{t("contactsPublicDesk")}</a></td><td>001</td></tr>
                <tr><th scope="row">{t("contactsRecords")}</th><td><a href="#submissions">{t("contactsRecordsDesk")}</a></td><td>014</td></tr>
                <tr><th scope="row">{t("contactsMissing")}</th><td><a href="#withdrawn">{t("contactsMissingDesk")}</a></td><td>014</td></tr>
                <tr><th scope="row">{t("contactsReturned")}</th><td>{t("contactsReturnedDesk")}</td><td>—</td></tr>
              </tbody>
            </table>
            <p className={styles.registerNote}>{t("contactsNote")}</p>
            <p className={styles.registerAction}>
              <UnavailableLink
                label={t("contactsWrite")}
                dialogTitle={t("closedDialogTitle")}
                heading={t("contactsWriteHeading")}
                body={t("contactsWriteBody")}
                detail={t("contactsWriteRef")}
              />
            </p>
          </section>

          <section aria-labelledby="revision-title">
            <h2 id="revision-title">{t("revisionTitle")}</h2>
            <table aria-label={t("revisionLabel")}>
              <thead><tr><th scope="col">{t("revisionIssue")}</th><th scope="col">{t("revisionDate")}</th><th scope="col">{t("revisionAmendment")}</th></tr></thead>
              <tbody>
                <tr><th scope="row">04.2</th><td>14.11.2003</td><td>{t("revisionFourAmendment")}</td></tr>
                <tr><th scope="row">04.2</th><td>14.11.2003</td><td>{t("revisionOneAmendment")}</td></tr>
                <tr><th scope="row">04.1</th><td>08.06.2001</td><td>{t("revisionTwoAmendment")}</td></tr>
                <tr><th scope="row">04.1</th><td>08.06.2001</td><td>{t("revisionThreeAmendment")}</td></tr>
              </tbody>
            </table>
            <p className={styles.registerNote}>{t("revisionNote")}</p>
          </section>
        </div>

        <div className={styles.policies}>
          <details id="accessibility"><summary>{t("policyAccessibility")}</summary><p>{t("policyAccessibilityBody")}</p></details>
          <details id="privacy"><summary>{t("policyPrivacy")}</summary><p>{t("policyPrivacyBody")}</p></details>
          <details id="terms"><summary>{t("policyTerms")}</summary><p>{t("policyTermsBody")}</p></details>
        </div>

        <footer className={styles.footer}>
          <div className={styles.footerRow}>
            <p>{t("footerRegistry")} <span aria-hidden="true">·</span> {t("footerService")}</p>
            <p className={styles.footerRevised}>{t("footerRevised")}</p>
          </div>

          <div className={`${styles.footerRow} ${styles.footerFoot}`}>
            <p className={styles.footerEnd}>
              <span>{t("footerPage")}</span>
              <span data-alter={t("footerEndAlter")} data-alter-after={ALTER_FOOTER_MS}>{t("footerEnd")}</span>
            </p>
            <a className={styles.footerTop} href="#top">{t("footerTop")}</a>
          </div>
        </footer>
      </div>
      <PortalSigns />
    </div>
  );
}
