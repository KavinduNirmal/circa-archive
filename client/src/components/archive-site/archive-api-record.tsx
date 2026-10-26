import { useLocale, useTranslations } from "next-intl";
import type { ArchiveDestination } from "@/lib/search/destination";
import { Link } from "@/i18n/navigation";
import { ArchiveChrome } from "./archive-chrome";
import { ArchiveButton } from "./archive-button";
import { RecordProse } from "./record-prose";
import { RecordAccessRequest } from "./record-access-request";
import styles from "./archive-site.module.css";

function DestinationBody({ destination }: { destination: ArchiveDestination }) {
  const t = useTranslations("site");
  const locale = useLocale();
  if (destination.markdown !== null)
    return (
      <RecordProse
        source={destination.markdown}
        redactionLabel={t("recordRedaction")}
        imageNotHeld={t("figureNotHeld")}
      />
    );
  return (
    <section className={styles.heldNotice}>
      <h2>
        {t(
          destination.type === "incident"
            ? "destinationSealedIncident"
            : "destinationSealedRecord",
        )}
      </h2>
      <p>
        {t(
          destination.type === "incident"
            ? "destinationAcknowledgeBody"
            : "destinationRequestBody",
        )}
      </p>
      {destination.type === "incident" ? (
        <form
          action={`/${locale}/site/records/${encodeURIComponent(destination.code)}`}
          method="get"
        >
          <ArchiveButton
            tone="paper"
            type="submit"
            name="acknowledge"
            value="true"
          >
            {t("destinationAcknowledge")}
          </ArchiveButton>
        </form>
      ) : (
        <RecordAccessRequest
          code={destination.code}
          initialStatus={destination.requestStatus}
          labels={{
            request: t("destinationRequest"),
            pending: t("destinationPending"),
            denied: t("destinationDenied"),
            expired: t("destinationExpired"),
            error: t("destinationRequestError"),
            signIn: t("destinationSignIn"),
          }}
        />
      )}
    </section>
  );
}

export function ArchiveApiRecord({
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
            <DestinationBody destination={destination} />
          </div>
          {destination.rumours.length > 0 && (
            <section aria-labelledby="rumours-title">
              <h2 id="rumours-title">{t("searchOptionRumour")}</h2>
              {destination.rumours.map((rumour) => (
                <section
                  key={rumour.id}
                  id={rumour.code}
                  className={styles.sheet}
                >
                  <h3>{rumour.title}</h3>
                  <DestinationBody destination={rumour} />
                </section>
              ))}
            </section>
          )}
          <p className={styles.back}>
            <Link href="/site/records">{t("recordBack")} «</Link>
          </p>
        </article>
      </main>
    </ArchiveChrome>
  );
}
