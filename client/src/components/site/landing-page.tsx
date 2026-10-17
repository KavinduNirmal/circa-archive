import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "../language-switcher";
import styles from "./landing-page.module.css";

/**
 * The public portal, rendered in whatever language the request resolved to.
 *
 * This is a Server Component, so the prose is never sent to the browser as
 * messages; it arrives as rendered HTML. Only the two archive links and the
 * language switcher are interactive, and the switcher's own copy is the one
 * small namespace the client bundle carries.
 */

/** Directory rows, in reading order. Numbers and anchors are structural, not copy. */
const directory = [
  ["01", "publicAccess", "public-access"],
  ["02", "submissions", "submissions"],
  ["03", "organizations", "organizations"],
  ["04", "credentials", "credentials"],
] as const;

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
          <span>{t("utilityService")}</span>
          <span className={styles.utilityEdition}>{t("utilityEdition")} <a href="#accessibility">{t("utilityAssistance")}</a></span>
          <LanguageSwitcher className={styles.utilityLanguage} />
        </div>
        <header className={styles.masthead}>
          <div className={styles.seal} aria-hidden="true"> <span>IR / CA</span> </div>
          <div>
            <p className={styles.eyebrow}>{t("eyebrow")}</p>
            <h1>{t("agencyLineOne")}<br />{t("agencyLineTwo")}</h1>
            <p className={styles.motto}>{t("motto")}</p>
          </div>
          <div className={styles.mastheadRef}>
            <span>{t("circularLabel")}</span><strong>{t("circularNumber")}</strong><span>{t("circularStatus")}</span>
          </div>
        </header>
        <nav className={styles.topnav} aria-label={t("navLabel")}>
          <a href="#public-access" aria-current="page">{t("navHome")}</a>
          <a href="#about">{t("navAbout")}</a>
          <a href="#documents">{t("navDocuments")}</a>
          <a href="#contacts">{t("navContacts")}</a>
          <a href="#credentials">{t("navCredentials")} <span aria-hidden="true">→</span></a>
        </nav>
        <div className={styles.breadcrumb}>
          <span>{t("breadcrumbTrail")} <strong>{t("breadcrumbIndex")}</strong></span>
          <span>{t("documentStatus")} <b>{t("documentCurrent")}</b></span>
        </div>

        <div className={styles.layout}>


          <main id="public-access" tabIndex={-1} aria-labelledby="public-access-title" className={styles.main}>
            <div className={styles.documentHead}><span>{t("accessCode")}</span><span>{t("accessRetain")}</span></div>
            <h2 id="public-access-title" className={styles.pageTitle}>{t("accessTitle")}</h2>
            <p className={styles.intro}>{t("accessIntro")}</p>
            <p>{t("accessBody")}</p>
            <div className={styles.entry}>
              <div><Link href="/desktop" className={styles.enter}>{t("enterArchive")} <span aria-hidden="true">→</span></Link><p>{t("enterNote")}</p></div>
              <span className={styles.entryCode}>{t("accessPoint")}<br />{t("readingRoom")}</span>
            </div>
            <p className={styles.firstVisit}>
              {t.rich("firstVisit", {
                strong: (chunks) => <strong>{chunks}</strong>,
                b: (chunks) => <b>{chunks}</b>,
              })}
            </p>
            <nav className={styles.mobileDirectory} aria-label={t("procedureShortcuts")}>
              <a href="#submissions">{t("submissions")}</a>
              <a href="#organizations">{t("organizations")}</a>
              <a href="#credentials">{t("credentials")}</a>
            </nav>
            <div className={styles.notice}>
              <strong>{t("noticeHeading")}</strong>
              <p>{t("noticeBody")}</p>
              <span>{t("noticeSource")}</span>
            </div>

            <Procedure id="submissions" number="02" title={t("submissions")}>
              <p>{t("submissionsBody")}</p>
              <ol className={styles.steps}>
                <li>{t("submissionsStepOne")}</li>
                <li>{t("submissionsStepTwo")}</li>
                <li>{t("submissionsStepThree")}</li>
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
              <Link href="/desktop">{t("credentialsContinue")} <span aria-hidden="true">»</span></Link>
              <p className={styles.small}>{t("credentialsSmall")}</p>
            </Procedure>

            <section id="about" className={styles.about} aria-labelledby="about-title">
              <h2 id="about-title">{t("aboutTitle")}</h2>
              <p>{t("aboutBody")}</p>
              <p className={styles.doctrine}>{t("aboutDoctrine")}</p>
              <p className={styles.small}>{t("aboutSmall")}</p>
            </section>
          </main>

          <aside className={styles.sidebar}>
            <nav aria-label={t("directoryLabel")}>
              <h2 className={styles.barTitle}>{t("directoryTitle")}</h2>
              {directory.map(([number, key, id]) => (
                <a className={styles.directoryLink} href={`#${id}`} key={id}><span>{number}</span>{t(key)}</a>
              ))}
              <a className={styles.directoryLink} href="#notices"><span>05</span>{t("directoryNotices")}</a>
            </nav>
            <section className={styles.sideSection} aria-labelledby="hours-title">
              <h2 id="hours-title">{t("hoursTitle")}</h2>
              <p>{t("hoursDays")}<br />{t("hoursTimes")}</p>
              <p className={styles.small}>{t("hoursNote")}</p>
            </section>
            <section className={styles.sideSection} aria-labelledby="clearance-title">
              <h2 id="clearance-title">{t("clearanceTitle")}</h2>
              <dl className={styles.clearance}>
                <div><dt>{t("clearancePublicTerm")}</dt><dd>{t("clearancePublicText")}</dd></div>
                <div><dt>{t("clearanceReviewerTerm")}</dt><dd>{t("clearanceReviewerText")}</dd></div>
                <div><dt>{t("clearanceRestrictedTerm")}</dt><dd>{t("clearanceRestrictedText")}</dd></div>
              </dl>
              <p className={styles.small}>{t("clearanceNote")}</p>
            </section>
            <div className={styles.displaced} aria-label={t("stampLabel")}>
              {t("stampSheet")}<br /><strong>{t("stampCount")}</strong><br />{t("stampRetain")}
            </div>
            <p className={styles.sidebarFoot}>{t("sidebarFootMaintained")}<br />{t("sidebarFootOffice")} <span className={styles.redaction} aria-label={t("redactionLabel")}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span><br />{t("sidebarFootRoom")}</p>
          </aside>

          <aside className={styles.bulletins} aria-label={t("bulletinsLabel")}>
            <section id="notices" aria-labelledby="news-title">
              <h2 className={styles.barTitle} id="news-title">{t("newsTitle")}</h2>
              <p className={styles.newsUpdated}>{t("newsUpdated")}</p>
              <article className={styles.newsItem}><time dateTime="2003-11-14">{t("newsOneDate")}</time><h3><a href="#documents">{t("newsOneTitle")}</a></h3><p>{t("newsOneBody")}</p></article>
              <article className={styles.newsItem}><time dateTime="2001-06-08">{t("newsTwoDate")}</time><h3><a href="#contacts">{t("newsTwoTitle")}</a></h3><p>{t("newsTwoBody")}</p></article>
              <article className={styles.newsItem}><time dateTime="1999-01-01">{t("newsThreeDate")}</time><h3>{t("newsThreeTitle")}</h3><p>{t("newsThreeBody")}</p></article>
              <p className={styles.newsEnd}>{t("newsEnd")}</p>
            </section>
            <section id="documents" aria-labelledby="documents-title" className={styles.sideSection}>
              <h2 id="documents-title">{t("documentsTitle")}</h2>
              <ul className={styles.documentList}>
                <li><a href="#public-access">{t("documentOne")}</a><span>{t("documentOneMeta")}</span></li>
                <li><a href="#submissions">{t("documentTwo")}</a><span>{t("documentTwoMeta")}</span></li>
                <li><a href="#organizations">{t("documentThree")}</a><span>{t("documentThreeMeta")}</span></li>
                <li><a href="#withdrawn">{t("documentFour")}</a><span>{t("documentFourMeta")}</span></li>
              </ul>
            </section>
            <section id="withdrawn" className={styles.withdrawn} aria-labelledby="withdrawn-title">
              <h2 id="withdrawn-title">{t("withdrawnTitle")}</h2>
              <p>{t("withdrawnBody")}</p>
            </section>
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
              </tbody>
            </table>
            <p>{t("contactsNote")}</p>
          </section>
          <section aria-labelledby="revision-title">
            <h2 id="revision-title">{t("revisionTitle")}</h2>
            <table aria-label={t("revisionLabel")}>
              <thead><tr><th scope="col">{t("revisionIssue")}</th><th scope="col">{t("revisionDate")}</th><th scope="col">{t("revisionAmendment")}</th></tr></thead>
              <tbody>
                <tr><th scope="row">04.2</th><td>14.11.2003</td><td>{t("revisionOneAmendment")}</td></tr>
                <tr><th scope="row">04.1</th><td>08.06.2001</td><td>{t("revisionTwoAmendment")}</td></tr>
                <tr><th scope="row">04.1</th><td>08.06.2001</td><td>{t("revisionThreeAmendment")}</td></tr>
              </tbody>
            </table>
            <p>{t("revisionNote")}</p>
          </section>
        </div>
        <div className={styles.policies}>
          <details id="accessibility"><summary>{t("policyAccessibility")}</summary><p>{t("policyAccessibilityBody")}</p></details>
          <details id="privacy"><summary>{t("policyPrivacy")}</summary><p>{t("policyPrivacyBody")}</p></details>
          <details id="terms"><summary>{t("policyTerms")}</summary><p>{t("policyTermsBody")}</p></details>
        </div>
        <footer className={styles.footer}>
          <p>{t("footerRegistry")} <span>·</span> {t("footerService")}</p>
          <a href="#top">{t("footerTop")}</a>
          <p className={styles.footerEnd}><span>{t("footerPage")}</span><span>{t("footerEnd")}</span></p>
        </footer>
      </div>
    </div>
  );
}
