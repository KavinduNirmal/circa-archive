import Link from "next/link";
import styles from "./landing-page.module.css";

const directory = [
  ["01", "Public access", "public-access"],
  ["02", "Submission procedure", "submissions"],
  ["03", "Organization filings", "organizations"],
  ["04", "Credential verification", "credentials"],
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
  return (
    <div className={styles.portal} id="top">
      <a className={styles.skip} href="#public-access">Skip to public access</a>
      <div className={styles.site}>
        <div className={styles.utility}>
          <span>PUBLIC INFORMATION SERVICE</span>
          <span>Text edition · <a href="#accessibility">Access assistance</a></span>
        </div>
        <header className={styles.masthead}>
          <div className={styles.seal} aria-hidden="true"> <span>IR / CA</span> </div>
          <div>
            <p className={styles.eyebrow}>Office of the Permanent Registry</p>
            <h1>Commission for Incident Review<br />and Corrective Action</h1>
            <p className={styles.motto}>Continuity of record. Continuity of administration.</p>
          </div>
          <div className={styles.mastheadRef}>
            <span>PUBLIC CIRCULAR</span><strong>No. 04 / 1998</strong><span>ISSUE STILL IN FORCE</span>
          </div>
        </header>
        <nav className={styles.topnav} aria-label="Agency navigation">
          <a href="#public-access" aria-current="page">Home</a>
          <a href="#about">About the Commission</a>
          <a href="#documents">Forms &amp; circulars</a>
          <a href="#contacts">Contact directory</a>
          <a href="#credentials">Personnel access <span aria-hidden="true">→</span></a>
        </nav>
        <div className={styles.breadcrumb}>
          <span>Registry / Public information / <strong>Index</strong></span>
          <span>Document status: <b>CURRENT</b></span>
        </div>

        <div className={styles.layout}>


          <main id="public-access" tabIndex={-1} aria-labelledby="public-access-title" className={styles.main}>
            <div className={styles.documentHead}><span>PA–01 / GENERAL CIRCULATION</span><span>Retain for reference</span></div>
            <h2 id="public-access-title" className={styles.pageTitle}>Public access to the registry</h2>
            <p className={styles.intro}>The Commission maintains records of reported incidents, subsequent reviews, and actions entered against them.</p>
            <p>Correspondents may consult released records without an appointment. The presence of a record confirms its receipt. It does not confirm the events described.</p>
            <div className={styles.entry}>
              <div><Link href="/desktop" className={styles.enter}>Enter the archive <span aria-hidden="true">→</span></Link><p>No credentials required for public inspection.</p></div>
              <span className={styles.entryCode}>ACCESS POINT 01<br />READING ROOM</span>
            </div>
            <p className={styles.firstVisit}><strong>First consultation?</strong> Open <b>Archive</b> at the workstation to browse records, or <b>Search</b> to find a title or reference number. Begin with an incident, then consult the records filed against it.</p>
            <nav className={styles.mobileDirectory} aria-label="Procedure shortcuts">
              <a href="#submissions">Submission procedure</a>
              <a href="#organizations">Organization filings</a>
              <a href="#credentials">Credential verification</a>
            </nav>
            <div className={styles.notice}>
              <strong>NOTICE TO CORRESPONDENTS</strong>
              <p>If a record names you in error, retain the reference number. Do not submit a second name.</p>
              <span>Administrative instruction 6(b). Reissued without amendment.</span>
            </div>

            <Procedure id="submissions" number="02" title="Submission procedure">
              <p>File an account of an incident, a discovery report, or a subsequent exploration. Separate what was observed from what was supplied by another correspondent.</p>
              <ol className={styles.steps}>
                <li>Consult existing records. Cite the incident reference where one exists.</li>
                <li>Record the location, sequence of events, and source of each observation. Preserve contradictory accounts as separate continuities.</li>
                <li>Open the record editor at the workstation to prepare a draft. Retain author credit and the lineage of any record you extend.</li>
              </ol>
              <p className={styles.serviceNote}><strong>Transmission notice:</strong> Drafts remain in this browser only while the editor is open. Retain a separate copy before closing or reloading. Saving, publication, and remote filing are not connected.</p>
              <details className={styles.disclosure}>
                <summary>Read the rules for submitted material · SP–02</summary>
                <div><p>Submit original material or material you have permission to use. Preserve citations and author credit. Do not include personal details, threats, or targeted harassment of real persons.</p><p>Disagreement between accounts may be filed. Misconduct toward a correspondent may not. Records removed from public discovery are retained as tombstones under the applicable review procedure.</p></div>
              </details>
            </Procedure>
            <Procedure id="organizations" number="03" title="Organization filings">
              <p>To identify an organization, prepare the following particulars. An organization is an entry in the directory; it is not a personnel account.</p>
              <dl className={styles.particulars}>
                <div><dt>A. BRIEF</dt><dd>Name, remit, and terms used to classify incidents.</dd></div>
                <div><dt>B. VOICE</dt><dd>A short sample record in the organization’s own language.</dd></div>
                <div><dt>C. SEED</dt><dd>An initial incident establishing the basis for a file.</dd></div>
              </dl>
              <p>Review considers interest and coherence. Advisory votes do not confer recognition. Recognition by an existing body requires a separate record and approval from both parties.</p>
              <p className={styles.serviceNote}>Organization submissions are not being transmitted from this terminal. Existing dossiers may be consulted through <b>Organizations</b> at the workstation.</p>
            </Procedure>
            <Procedure id="credentials" number="04" title="Credential verification">
              <p>Returning reviewers may resume public inspection at the workstation. Credential verification is not connected; no password or personnel number is required or collected here.</p>
              <Link href="/desktop">Continue to the public workstation <span aria-hidden="true">»</span></Link>
              <p className={styles.small}>A previous appointment does not imply a present vacancy.</p>
            </Procedure>

            <section id="about" className={styles.about} aria-labelledby="about-title">
              <h2 id="about-title">Concerning the Commission</h2>
              <p>The Commission receives incident reports, preserves their supporting records, and maintains the register of organizations and continuities. Its jurisdiction is limited to the material on file.</p>
              <p className={styles.doctrine}>The archive does not decide truth. It decides what is on file.</p>
              <p className={styles.small}>Authority: continuing administrative arrangement, date of commencement not transferred.</p>
            </section>
          </main>

          <aside className={styles.sidebar}>
            <nav aria-label="Public directory">
              <h2 className={styles.barTitle}>Public directory</h2>
              {directory.map(([number, title, id]) => (
                <a className={styles.directoryLink} href={`#${id}`} key={id}><span>{number}</span>{title}</a>
              ))}
              <a className={styles.directoryLink} href="#notices"><span>05</span>Notices &amp; revisions</a>
            </nav>
            <section className={styles.sideSection} aria-labelledby="hours-title">
              <h2 id="hours-title">Registry hours</h2>
              <p>Monday–Friday<br />09:00–17:00</p>
              <p className={styles.small}>Correspondence received outside these hours will be dated the preceding working day.</p>
            </section>
            <section className={styles.sideSection} aria-labelledby="clearance-title">
              <h2 id="clearance-title">Access classification</h2>
              <dl className={styles.clearance}>
                <div><dt>PUBLIC</dt><dd>Released index</dd></div>
                <div><dt>REVIEWER</dt><dd>Assigned records</dd></div>
                <div><dt>RESTRICTED</dt><dd>By reference only</dd></div>
              </dl>
              <p className={styles.small}>Classification describes the record, not the correspondent.</p>
            </section>
            <div className={styles.displaced} aria-label="Administrative stamp: continuation sheet 2 of 1">
              CONTINUATION SHEET<br /><strong>2 OF 1</strong><br />RETAIN WITH ORIGINAL
            </div>
            <p className={styles.sidebarFoot}>Index maintained by<br />the Office of <span className={styles.redaction} aria-label="name withheld">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span><br />Room 014 · Registry annex</p>
          </aside>

          <aside className={styles.bulletins} aria-label="Circulars and registry notices">
            <section id="notices" aria-labelledby="news-title">
              <h2 className={styles.barTitle} id="news-title">What’s new</h2>
              <p className={styles.newsUpdated}>Last updated: 14 November 2003</p>
              <article className={styles.newsItem}><time dateTime="2003-11-14">14.11.2003</time><h3><a href="#documents">Revised public access circular</a></h3><p>The previous circular remains in force until this revision has been withdrawn.</p></article>
              <article className={styles.newsItem}><time dateTime="2001-06-08">08.06.2001</time><h3><a href="#contacts">Directory correction</a></h3><p>Room 014 has been removed from the floor plan. Correspondence should continue to be addressed there.</p></article>
              <article className={styles.newsItem}><time dateTime="1999-01-01">01.01.1999</time><h3>Calendar conversion complete</h3><p>No interruption to the previous year is anticipated.</p></article>
              <p className={styles.newsEnd}>No further notices have been received.</p>
            </section>
            <section id="documents" aria-labelledby="documents-title" className={styles.sideSection}>
              <h2 id="documents-title">Forms &amp; circulars</h2>
              <ul className={styles.documentList}>
                <li><a href="#public-access">PA–01 · Public access statement</a><span>Current issue · 1 page</span></li>
                <li><a href="#submissions">SP–02 · Preparation of records</a><span>Revision 3 · 2 pages</span></li>
                <li><a href="#organizations">OF–03 · Organization particulars</a><span>Unnumbered attachment</span></li>
                <li><a href="#withdrawn">AC–09 · Closure of a file</a><span>Copy unavailable</span></li>
              </ul>
            </section>
            <section id="withdrawn" className={styles.withdrawn} aria-labelledby="withdrawn-title">
              <h2 id="withdrawn-title">Document not supplied</h2>
              <p>AC–09 is listed for completeness. No public copy is held. The instruction to remove this reference was filed under AC–09.</p>
            </section>
            <div className={styles.registerMark} aria-hidden="true">REGISTRY COPY<br />CHECKED &nbsp; / &nbsp; 04</div>
          </aside>
        </div>

        <div className={styles.registers}>
          <section id="contacts" aria-labelledby="contacts-title">
            <h2 id="contacts-title">06 / Contact directory</h2>
            <table aria-label="Contact directory">
              <thead><tr><th scope="col">Enquiries concerning</th><th scope="col">Refer to</th><th scope="col">Room</th></tr></thead>
              <tbody>
                <tr><th scope="row">Public inspection</th><td><a href="#public-access">Access desk</a></td><td>001</td></tr>
                <tr><th scope="row">New records / amendments</th><td><a href="#submissions">Filing clerk</a></td><td>014</td></tr>
                <tr><th scope="row">Missing correspondence</th><td><a href="#withdrawn">Records retention</a></td><td>014</td></tr>
              </tbody>
            </table>
            <p>Routing references only. Direct correspondence is not available from this terminal.</p>
          </section>
          <section aria-labelledby="revision-title">
            <h2 id="revision-title">07 / Revision register</h2>
            <table aria-label="Revision register">
              <thead><tr><th scope="col">Issue</th><th scope="col">Date entered</th><th scope="col">Amendment</th></tr></thead>
              <tbody>
                <tr><th scope="row">04.2</th><td>14.11.2003</td><td>Public directory corrected.</td></tr>
                <tr><th scope="row">04.1</th><td>08.06.2001</td><td>Previous signatory removed.</td></tr>
                <tr><th scope="row">04.1</th><td>08.06.2001</td><td>No previous signatory recorded.</td></tr>
              </tbody>
            </table>
            <p>Entries reproduced as received. Numbering discrepancies are retained.</p>
          </section>
        </div>
        <div className={styles.policies}>
          <details id="accessibility"><summary>Accessibility statement</summary><p>This index supports keyboard navigation, text enlargement, and reduced motion. All public instructions are supplied as text. Reading order takes precedence over the order in which material was received.</p></details>
          <details id="privacy"><summary>Privacy &amp; retention</summary><p>This page contains no credential or correspondence form. Draft records prepared at the workstation are temporary. Closing the editor or reloading discards them; retain a separate copy. A name withheld from a public copy is not an empty field.</p></details>
          <details id="terms"><summary>Conditions of consultation</summary><p>Released records may contain incomplete, contradictory, or withdrawn accounts. A reference is evidence of filing, not verification. Retain attribution when extending a record. The Commission assumes no authority over events not yet entered.</p></details>
        </div>
        <footer className={styles.footer}>
          <p>Office of the Permanent Registry <span>·</span> Public information service</p>
          <a href="#top">Return to top ↑</a>
          <p className={styles.footerEnd}><span>Page 1 of 1 · Approved for general circulation</span><span>End of available document.</span></p>
        </footer>
      </div>
    </div>
  );
}
