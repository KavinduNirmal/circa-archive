import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ArchiveDestination } from "@/lib/search/destination";
import { ArchiveChrome } from "./archive-chrome";
import { RecordProse } from "./record-prose";
import styles from "./archive-site.module.css";

export function ArchiveApiDossier({
  destination,
}: {
  destination: ArchiveDestination;
}) {
  const t = useTranslations("site");
  return (
    <ArchiveChrome
      active="records"
      trail={[
        { label: t("trailRecords"), href: "/site/records" },
        { label: destination.code },
      ]}
    >
      <main id="site-content" tabIndex={-1} className={styles.page}>
        <article className={styles.record}>
          <header className={styles.recordHead}>
            <p className={styles.kicker}>{destination.code}</p>
            <h1 className={styles.recordTitle}>{destination.title}</h1>
          </header>
          <div className={styles.sheet}>
            {destination.markdown ? (
              <RecordProse
                source={destination.markdown}
                redactionLabel={t("recordRedaction")}
                imageNotHeld={t("figureNotHeld")}
              />
            ) : (
              <p>{t("dossierNotDocumented")}</p>
            )}
          </div>
          <p className={styles.back}>
            <Link href="/site/records">{t("recordBack")} «</Link>
          </p>
        </article>
      </main>
    </ArchiveChrome>
  );
}
