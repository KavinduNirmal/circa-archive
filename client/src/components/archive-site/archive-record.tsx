import { notFound } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  List,
  MessageSquare,
  Monitor,
  Shuffle,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ARCHIVE_INDEX } from "../browser/archive-index";
import { ANNOTATIONS, followUpsFor, notesFor } from "../reader/reader-correspondence";
import { recordDocument } from "../reader/record-filings";
import { sectionAnchor, type ReaderBlock } from "../reader/reader-model";
import { ArchiveChrome } from "./archive-chrome";
import { ArchiveButton } from "./archive-button";
import buttonStyles from "./archive-button.module.css";
import { CLASS_MESSAGE_KEY, CONSULTATIONS, STATUS_MESSAGE_KEY, neighboursOf } from "./archive-data";
import { RecordNotes } from "./record-notes";
import { RecordProse } from "./record-prose";
import styles from "./archive-site.module.css";

/**
 * One record, as a work page.
 *
 * The reading edition of a filing, laid out the way a reading room hands one
 * over: the leaf's own head at the top, the tools that act on the whole record
 * across a single bar, then the sheet. The sheet carries the document itself —
 * typed prose, a printed margin of section numerals, the tables the author
 * filed — and the page's own margin carries what a reader wants while reading
 * rather than after: the particulars, the citations, and the workstation.
 *
 * The foot of the sheet is where the corpus files its own footer: the metadata
 * register, the cross-reference register, and the colophon. Those are authored
 * Markdown tables, so they are styled by the prose rules rather than restated
 * here — a record's own metadata is never printed twice.
 *
 * The notes are the page's only client island. Everything above them is server
 * HTML, including the prose; the composer holds a draft in the browser because
 * the public archive has no writing desk of its own.
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

            {/*
              The name of the filing and its address, on one line. The code is
              the record's identity and its shelf address at once, so it is
              drawn as a plate; the status is a dot and a word beside it. Nothing
              else belongs at this level — the facts underneath are the detail.
            */}
            <div className={styles.recordHeadline}>
              <h1 className={styles.recordTitle}>{document.designation ?? t("withheldDesignation")}</h1>
              <div className={styles.recordCode}>
                <span className={styles.codeValue} data-klass={entry.klass}>{document.code}</span>
                <span className={styles.recordStatus} data-status={entry.status}>
                  <span className={styles.statusDot} aria-hidden="true" />
                  {t(STATUS_MESSAGE_KEY[entry.status])}
                </span>
              </div>
            </div>

            <dl className={styles.recordFacts}>
              <div>
                <dt>{t("recordHolder")}</dt>
                <dd className="circa-mono">{document.organization}</dd>
              </div>
              <div>
                <dt>{t("recordFiled")}</dt>
                <dd className="circa-mono">{document.filed}</dd>
              </div>
              <div>
                <dt>{t("recordClearance")}</dt>
                <dd>{document.clearance}</dd>
              </div>
            </dl>
          </header>

          {/*
            One toolbar for the whole record. The three tools that act on the
            record sit together on the left, the step through the register sits
            with them as a pager, and the two ways out of the page sit on the
            right. The foot of the page repeats the step at a size worth reaching
            for once the filing has been read.
          */}
          <nav className={styles.actions} aria-label={t("recordActions")}>
            <div className={styles.actionGroup}>
              <ArchiveButton
                tone="paper"
                raw
                href="#notes"
                icon={<MessageSquare aria-hidden size={12} />}
              >
                {t("actionNotes", { count: notes.length })}
              </ArchiveButton>

              <details className={styles.download}>
                {/*
                  A `<details>` trigger has to be a `<summary>`, so it cannot be an
                  ArchiveButton; it wears the button's own class instead, which is
                  the whole reason the class is exported.
                */}
                <summary className={`${buttonStyles.button} ${styles.downloadSummary}`} data-tone="paper">
                  <Download aria-hidden size={12} />
                  {t("actionDownload")}
                </summary>
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

              <ArchiveButton tone="paper" href="/site/records" icon={<List aria-hidden size={12} />}>
                {t("actionIndex")}
              </ArchiveButton>
            </div>

            <span className={styles.actionSpacer} />

            {(previous || next) && (
              <div className={styles.stepper}>
                {previous ? (
                  <Link
                    className={styles.step}
                    data-dir="prev"
                    href={`/site/records/${previous.code}`}
                    aria-label={`${t("recordPrev")}: ${previous.code}`}
                  >
                    <ChevronLeft aria-hidden size={13} />
                    <span className={styles.stepCode}>{previous.code}</span>
                  </Link>
                ) : null}
                {next ? (
                  <Link
                    className={styles.step}
                    data-dir="next"
                    href={`/site/records/${next.code}`}
                    aria-label={`${t("recordNext")}: ${next.code}`}
                  >
                    <span className={styles.stepCode}>{next.code}</span>
                    <ChevronRight aria-hidden size={13} />
                  </Link>
                ) : null}
              </div>
            )}

            <div className={styles.actionGroup}>
              <ArchiveButton tone="paper" href="/site/random" icon={<Shuffle aria-hidden size={12} />}>
                {t("actionRandom")}
              </ArchiveButton>
              <ArchiveButton tone="paper" href="/desktop" icon={<Monitor aria-hidden size={12} />}>
                {t("actionWorkstation")}
              </ArchiveButton>
            </div>
          </nav>

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

          {/*
            The sheet. Section numerals sit in the printed margin rather than in
            the running text, so a heading rule spans the body and the eye can
            find a leaf by its number without reading the heading.
          */}
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

          <RecordNotes
            notes={notes.map((note) => ({
              id: note.id,
              author: note.author,
              when: note.when,
              paragraphs: note.body.split("\n\n"),
              replies: note.replies.map((reply) => ({
                id: reply.id,
                author: reply.author,
                when: reply.when,
                paragraphs: reply.body.split("\n\n"),
              })),
            }))}
            labels={{
              title: t("notesTitle"),
              lead: t("notesLead"),
              empty: t("notesEmpty"),
              composerTitle: t("noteComposerTitle", { code: document.code }),
              composerHint: t("noteComposerHint"),
              name: t("noteName"),
              namePlaceholder: t("noteNamePlaceholder"),
              body: t("noteBody"),
              bodyPlaceholder: t("noteBodyPlaceholder"),
              submit: t("noteSubmit"),
              anonymous: t("noteAnonymous"),
              draft: t("noteDraft"),
              draftWhen: t("noteDraftWhen"),
              discard: t("noteDiscard"),
              reply: t("noteReply"),
              // The author is only known in the composer, so the template crosses
              // to the client unformatted and is completed there.
              replyTo: t.raw("noteReplyTo"),
              cancel: t("noteCancel"),
              held: t("noteHeld"),
            }}
          />

          {/*
            The step at the foot. Big enough to hit without aiming, because a
            reader who has reached the end of a long filing is already deciding
            where to go next.
          */}
          <nav className={styles.recordNav} aria-label={t("recordOrder")}>
            {previous ? (
              <Link className={styles.leaf} data-dir="prev" href={`/site/records/${previous.code}`}>
                <span className={styles.leafDir}>
                  <ChevronLeft aria-hidden size={13} />
                  {t("recordPrev")}
                </span>
                <strong className={styles.leafTitle}>{previous.designation ?? previous.code}</strong>
                <span className={styles.leafCode}>{previous.code}</span>
              </Link>
            ) : null}
            {next ? (
              <Link className={styles.leaf} data-dir="next" href={`/site/records/${next.code}`}>
                <span className={styles.leafDir}>
                  {t("recordNext")}
                  <ChevronRight aria-hidden size={13} />
                </span>
                <strong className={styles.leafTitle}>{next.designation ?? next.code}</strong>
                <span className={styles.leafCode}>{next.code}</span>
              </Link>
            ) : null}
          </nav>

          <p className={styles.back}>
            <Link href="/site/records">{t("recordBack")} «</Link>
          </p>
        </article>

        <aside className={styles.recordAside}>
          <section className={styles.asideBlock} aria-labelledby="particulars-title">
            <h2 className={styles.asideTitle} id="particulars-title">{t("recordParticulars")}</h2>
            <dl className={styles.particulars}>
              <div><dt>{t("recordCode")}</dt><dd className="circa-mono">{document.code}</dd></div>
              <div><dt>{t("recordClass")}</dt><dd>{t(CLASS_MESSAGE_KEY[entry.klass])}</dd></div>
              <div><dt>{t("recordFiled")}</dt><dd className="circa-mono">{document.filed}</dd></div>
              <div><dt>{t("recordHolder")}</dt><dd className="circa-mono">{document.organization}</dd></div>
              <div><dt>{t("recordClearance")}</dt><dd>{document.clearance}</dd></div>
              <div><dt>{t("recordStatus")}</dt><dd>{t(STATUS_MESSAGE_KEY[entry.status])}</dd></div>
            </dl>
          </section>

          {/* The reading room's own count: how often the record has been asked for. */}
          <section className={styles.asideBlock} aria-labelledby="readership-title">
            <h2 className={styles.asideTitle} id="readership-title">{t("recordReadership")}</h2>
            <ul className={styles.readership}>
              <li>{t("popularCount", { count: consultations })}</li>
              <li>{t("statNotes", { count: notes.length })}</li>
              <li>{t("statCitations", { count: citations })}</li>
            </ul>
          </section>

          <section className={styles.asideBlock} aria-labelledby="references-title">
            <h2 className={styles.asideTitle} id="references-title">{t("recordReferences")}</h2>
            {inbound.length === 0 && outbound.length === 0 && (
              <p className={styles.asideNote}>{t("recordNoReferences")}</p>
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

          <section className={styles.asideBlock} aria-labelledby="record-workstation-title">
            <h2 className={styles.asideTitle} id="record-workstation-title">{t("homeWorkstationTitle")}</h2>
            <p className={styles.asideBody}>{t("recordWorkstationNote")}</p>
            <p className={styles.asideFoot}>
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
