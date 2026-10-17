import { notFound } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ARCHIVE_INDEX } from "../browser/archive-index";
import { ANNOTATIONS, followUpsFor, notesFor } from "../reader/reader-correspondence";
import { recordDocument } from "../reader/record-filings";
import { sectionAnchor, type ReaderBlock } from "../reader/reader-model";
import { ArchiveChrome } from "./archive-chrome";
import { CLASS_MESSAGE_KEY, CONSULTATIONS, STATUS_MESSAGE_KEY, neighboursOf } from "./archive-data";
import { RecordProse } from "./record-prose";
import styles from "./archive-site.module.css";

/**
 * One record, as a work page.
 *
 * The tools sit across the top, above the text, because a reader arrives
 * wanting to know three things before reading: whether there are notes on it,
 * whether they can take a copy away, and what comes next. The notes themselves
 * are at the foot, where a reader who has finished the filing will reach them;
 * the tool at the top is a jump link to that section.
 *
 * A filing that is held still gets a page. Its index entry is released, so the
 * page says exactly what is missing and offers no download, rather than
 * pretending the record does not exist.
 */
export function ArchiveRecord({ code }: { code: string }) {
  const t = useTranslations("site");
  const locale = useLocale();
  const document = recordDocument(code);
  const entry = ARCHIVE_INDEX.find((item) => item.code === code);
  if (!document || !entry) notFound();

  const { inbound, outbound } = followUpsFor(code);
  const { previous, next } = neighboursOf(code);
  const notes = notesFor(ANNOTATIONS, code, document.sections);
  const held = document.source === "held";
  const consultations = CONSULTATIONS[code] ?? 0;
  const citations = inbound.length + outbound.length;

  return (
    <ArchiveChrome active="records" trail={[
      { label: t("trailRecords"), href: "/site/records" },
      { label: document.code },
    ]}>
      <main id="site-content" tabIndex={-1} className={styles.recordLayout}>
        <article className={styles.record}>
          <header className={styles.recordHead}>
            <p className={styles.kicker}>
              <span>{t("recordLabel")}</span> · {t(CLASS_MESSAGE_KEY[entry.klass])}
            </p>
            <h1 className={styles.recordTitle}>{document.designation ?? t("withheldDesignation")}</h1>
            <p className={styles.recordCode}>
              <span className={styles.codeValue}>{document.code}</span>
              <span className={styles.statusChip} data-status={entry.status}>{t(STATUS_MESSAGE_KEY[entry.status])}</span>
            </p>
            <p className={styles.byline}>
              {t("recordHolder")}: <span className="circa-mono">{document.organization}</span> · {t("recordFiled")}: <span className="circa-mono">{document.filed}</span> · {t("recordClearance")}: {document.clearance}
            </p>
            <ul className={styles.tags}>
              <li className={styles.tag}>{t(CLASS_MESSAGE_KEY[entry.klass])}</li>
              <li className={styles.tag}>{t(STATUS_MESSAGE_KEY[entry.status])}</li>
              <li className={styles.tag}>{document.clearance}</li>
              <li className={styles.tag}>{t("recordLabel")}</li>
            </ul>
          </header>

          <nav className={styles.actions} aria-label={t("recordActions")}>
            <a className={styles.action} href="#notes">{t("actionNotes", { count: notes.length })}</a>

            <details className={styles.download}>
              <summary className={`${styles.action} ${styles.downloadSummary}`}>{t("actionDownload")}</summary>
              <ul className={styles.downloadList}>
                {held ? (
                  <li><span>{t("downloadHeld")}</span></li>
                ) : (
                  <>
                    <li>
                      <a href={`/${locale}/site/records/${document.code}/download?format=txt`} download>
                        {t("downloadText")}
                      </a>
                    </li>
                    <li>
                      <a href={`/${locale}/site/records/${document.code}/download?format=md`} download>
                        {t("downloadMarkdown")}
                      </a>
                    </li>
                  </>
                )}
              </ul>
            </details>

            <Link className={styles.action} href="/site/records">{t("actionIndex")}</Link>
            {previous ? (
              <Link className={styles.action} href={`/site/records/${previous.code}`}>
                « {t("actionPrevious")} · {previous.code}
              </Link>
            ) : null}
            {next ? (
              <Link className={styles.action} href={`/site/records/${next.code}`}>
                {t("actionNext")} · {next.code} »
              </Link>
            ) : null}
            <span className={styles.actionSpacer} />
            <Link className={styles.action} href="/site/random">{t("actionRandom")}</Link>
            <Link className={styles.action} href="/desktop">{t("actionWorkstation")}</Link>
          </nav>

          <p className={styles.stats}>
            <span className={styles.statsItem}>{t("popularCount", { count: consultations })}</span>
            <span className={styles.statsItem}>{t("statNotes", { count: notes.length })}</span>
            <span className={styles.statsItem}>{t("statCitations", { count: citations })}</span>
          </p>

          {held && (
            <p className={styles.heldNotice}>
              <strong>{t("recordHeldTitle")}</strong> {t("recordHeldBody")}
            </p>
          )}

          <nav className={styles.contents} aria-label={t("recordContents")}>
            <h2 className={styles.contentsTitle}>{t("recordContents")}</h2>
            <ol>
              {document.sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${sectionAnchor(section.id)}`}>
                    <span className={styles.sectionIndex}>{section.index}</span>
                    {section.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className={styles.sheet}>
            {document.sections.map((section) => (
              <section key={section.id} id={sectionAnchor(section.id)} className={styles.sheetSection}>
                <h2 className={styles.sheetHeading}>
                  <span className={styles.sectionIndex} aria-hidden="true">{section.index}</span>
                  {section.heading}
                </h2>
                {section.source ? (
                  <RecordProse
                    source={section.source}
                    redactionLabel={t("recordRedaction")}
                    imageNotHeld={t("figureNotHeld")}
                  />
                ) : null}
                {section.blocks.map((block, position) => (
                  <FilingBlock key={position} block={block} />
                ))}
              </section>
            ))}
          </div>

          <section className={styles.notes} id="notes" aria-labelledby="notes-title">
            <h2 className={styles.notesTitle} id="notes-title">{t("notesTitle")}</h2>
            <p className={styles.notesLead}>{t("notesLead")}</p>
            {notes.length === 0 ? (
              <p className={styles.body}>{t("notesEmpty")}</p>
            ) : (
              notes.map((note) => (
                <article className={styles.noteCard} key={note.id}>
                  <p className={styles.noteMeta}>
                    <span className={styles.noteAuthor}>{note.author}</span>
                    <span>{note.when}</span>
                  </p>
                  <div className={styles.noteBody}>
                    {note.body.split("\n\n").map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                  {note.replies.map((reply) => (
                    <div className={styles.noteReply} key={reply.id}>
                      <p className={styles.noteMeta}>
                        <span className={styles.noteAuthor}>{reply.author}</span>
                        <span>{reply.when}</span>
                      </p>
                      <div className={styles.noteBody}>
                        {reply.body.split("\n\n").map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </article>
              ))
            )}
          </section>

          <nav className={styles.recordNav} aria-label={t("recordOrder")}>
            {previous ? (
              <Link href={`/site/records/${previous.code}`}>
                <span>{t("recordPrev")}</span>
                <strong>{previous.designation ?? previous.code}</strong>
              </Link>
            ) : <span />}
            {next ? (
              <Link href={`/site/records/${next.code}`}>
                <span>{t("recordNext")}</span>
                <strong>{next.designation ?? next.code}</strong>
              </Link>
            ) : <span />}
          </nav>

          <p className={styles.back}>
            <Link href="/site/records">{t("recordBack")} «</Link>
          </p>
        </article>

        <aside className={styles.recordAside}>
          <section className={styles.panel} aria-labelledby="particulars-title">
            <h2 className={styles.panelTitle} id="particulars-title">{t("recordParticulars")}</h2>
            <dl className={styles.particulars}>
              <div><dt>{t("recordCode")}</dt><dd className="circa-mono">{document.code}</dd></div>
              <div><dt>{t("recordClass")}</dt><dd>{t(CLASS_MESSAGE_KEY[entry.klass])}</dd></div>
              <div><dt>{t("recordFiled")}</dt><dd className="circa-mono">{document.filed}</dd></div>
              <div><dt>{t("recordHolder")}</dt><dd className="circa-mono">{document.organization}</dd></div>
              <div><dt>{t("recordClearance")}</dt><dd>{document.clearance}</dd></div>
              <div><dt>{t("recordStatus")}</dt><dd>{t(STATUS_MESSAGE_KEY[entry.status])}</dd></div>
            </dl>
          </section>

          <section className={styles.panel} aria-labelledby="references-title">
            <h2 className={styles.panelTitle} id="references-title">{t("recordReferences")}</h2>
            {inbound.length === 0 && outbound.length === 0 && (
              <p className={styles.panelNote}>{t("recordNoReferences")}</p>
            )}
            {inbound.length > 0 && (
              <>
                <h3 className={styles.referenceHeading}>{t("recordInbound")}</h3>
                <ul className={styles.referenceList}>
                  {inbound.map((followUp) => (
                    <li key={followUp.code}>
                      <Link href={`/site/records/${followUp.code}`}>{followUp.code}</Link>
                      <span>{followUp.preview}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {outbound.length > 0 && (
              <>
                <h3 className={styles.referenceHeading}>{t("recordOutbound")}</h3>
                <ul className={styles.referenceList}>
                  {outbound.map((followUp) => (
                    <li key={followUp.code}>
                      <Link href={`/site/records/${followUp.code}`}>{followUp.code}</Link>
                      <span>{followUp.preview}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section className={styles.panel} aria-labelledby="record-workstation-title">
            <h2 className={styles.panelTitle} id="record-workstation-title">{t("homeWorkstationTitle")}</h2>
            <p className={styles.panelBody}>{t("recordWorkstationNote")}</p>
            <p className={styles.panelFoot}>
              <Link className={styles.more} href="/desktop">{t("recordWorkstation")} <span aria-hidden="true">»</span></Link>
            </p>
          </section>
        </aside>
      </main>
    </ArchiveChrome>
  );
}

function FilingBlock({ block }: { block: ReaderBlock }) {
  if (block.kind === "fields") {
    return (
      <dl className={styles.fields}>
        {block.rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd className={row.mono ? "circa-mono" : undefined}>{row.value}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return (
    <div className={styles.heldBlock}>
      <span className={styles.heldStamp}>{block.label}</span>
      <span className={styles.heldBars} role="img" aria-label={block.label}>
        <span /><span /><span />
      </span>
      <p className={styles.heldNote}>{block.note}</p>
    </div>
  );
}
