import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ARCHIVE_INDEX, type ArchiveEntry } from "../browser/archive-index";
import { explorationsFor } from "../reader/reader-correspondence";
import { ArchiveChrome } from "./archive-chrome";
import { RecordTable } from "./archive-records";
import styles from "./archive-site.module.css";

/**
 * The explorations filed against one record.
 *
 * This is a list, not a second kind of record page: every row is the ordinary
 * record table, and every code in it opens the ordinary record. The citation web
 * already knows which records were filed against which, so this page is a filter
 * over it rather than a relationship authored twice.
 *
 * The page sits outside the record's own sheet on purpose. A record's status bar
 * carries the count, and a reader who wants the list asks for it; a reader who
 * came to read the filing never meets a register in the middle of the prose.
 */
export function ArchiveExplorations({ code }: { code: string }) {
  const t = useTranslations("site");
  const parent = ARCHIVE_INDEX.find((entry) => entry.code === code);
  const filed = explorationsFor(code);
  const entries = filed
    .map((item) => ARCHIVE_INDEX.find((entry) => entry.code === item.code))
    .filter((entry): entry is ArchiveEntry => Boolean(entry));

  if (!parent || entries.length === 0) notFound();

  return (
    <ArchiveChrome active="records" trail={[
      { label: t("trailRecords"), href: "/site/records" },
      { label: parent.code, href: `/site/records/${parent.code}` },
      { label: t("recordExplorations") },
    ]}>
      <main id="site-content" tabIndex={-1} className={styles.page}>
        <header className={styles.pageHead}>
          <p className={styles.kicker}>{t("explorationsKicker", { code: parent.code })}</p>
          <h1 className={styles.title}>
            {t("explorationsHeading", { designation: parent.designation ?? parent.code })}
          </h1>
          <p className={styles.lede}>{t("explorationsLede", { count: entries.length })}</p>
          <p className={styles.note}>{t("explorationsNote")}</p>
        </header>

        <RecordTable entries={entries} label={t("explorationsTable", { code: parent.code })} />

        <p className={styles.back}>
          <Link href={`/site/records/${parent.code}`}>{t("explorationsBack", { code: parent.code })}</Link>
        </p>
      </main>
    </ArchiveChrome>
  );
}
