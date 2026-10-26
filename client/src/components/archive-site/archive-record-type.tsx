import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ArchiveClass } from "../browser/archive-index";
import { SITE_INDEX } from "./archive-data";
import { ArchiveChrome } from "./archive-chrome";
import { ArchiveReserved } from "./archive-reserved";
import { RecordTable } from "./archive-records";
import styles from "./archive-site.module.css";

/**
 * The record types named in the section bar.
 *
 * Incidents, explorations, and evidence are classes the index holds, so their
 * pages are the ordinary record table filtered to one class. Rumours and
 * playlists have no index of their own in the reading edition yet: their pages
 * are reserved, explain the relation they have to a record, and send the reader
 * back to the index rather than printing an empty register.
 */
export type RecordType =
  "incidents" | "explorations" | "evidence" | "rumours" | "playlists";

const CLASS_FOR_TYPE: Partial<Record<RecordType, ArchiveClass>> = {
  incidents: "incident",
  explorations: "exploration",
  evidence: "evidence",
};

const COPY: Record<RecordType, { title: string; lede: string; note: string }> =
  {
    incidents: {
      title: "classIncident",
      lede: "aboutClassIncidentBody",
      note: "recordTypeNote",
    },
    explorations: {
      title: "classExploration",
      lede: "aboutClassExplorationBody",
      note: "recordTypeNote",
    },
    evidence: {
      title: "classEvidence",
      lede: "aboutClassEvidenceBody",
      note: "recordTypeNote",
    },
    rumours: {
      title: "rumoursTitle",
      lede: "rumoursLede",
      note: "rumoursNote",
    },
    playlists: {
      title: "playlistsTitle",
      lede: "playlistsLede",
      note: "playlistsNote",
    },
  };

export function ArchiveRecordType({ kind }: { kind: RecordType }) {
  const t = useTranslations("site");
  const copy = COPY[kind];
  const klass = CLASS_FOR_TYPE[kind];
  const trail = [
    { label: t("trailRecords"), href: "/site/records" },
    { label: t(copy.title) },
  ];

  if (!klass) {
    return (
      <ArchiveReserved
        active="records"
        trail={trail}
        title={t(copy.title)}
        lede={t(copy.lede)}
        note={t(copy.note)}
        backLabel={t("recordBack")}
      />
    );
  }

  const entries = SITE_INDEX.filter((entry) => entry.klass === klass);

  return (
    <ArchiveChrome active="records" trail={trail}>
      <main id="site-content" tabIndex={-1} className={styles.page}>
        <header className={styles.pageHead}>
          <p className={styles.kicker}>{t("crumbRegistry")}</p>
          <h1 className={styles.title}>{t(copy.title)}</h1>
          <p className={styles.lede}>{t(copy.lede)}</p>
          <p className={styles.note}>{t(copy.note)}</p>
        </header>

        <p className={styles.count} role="status" aria-live="polite">
          {t("recordTypeCount", { count: entries.length })}
        </p>

        {entries.length > 0 ? (
          <RecordTable entries={entries} label={t(copy.title)} />
        ) : (
          <div className={styles.emptyState} role="status">
            <p className={styles.emptyTitle}>{t(copy.note)}</p>
          </div>
        )}

        <p className={styles.back}>
          <Link href="/site/records">{t("recordBack")} «</Link>
        </p>
      </main>
    </ArchiveChrome>
  );
}
