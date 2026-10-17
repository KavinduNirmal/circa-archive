import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ARCHIVE_INDEX } from "../browser/archive-index";

/**
 * The project page's small composition parts.
 *
 * These are shared by the landing page and the dossier so that a section heading
 * or the two edition panels is one piece of markup, not two that drift. Every
 * string still comes from the `meta` catalog.
 */

/**
 * A section opening: the folio number and kicker on the left rail, the title
 * and its lede sharing one band. The band is the page's repeating unit, so the
 * eye learns where a section begins without a card or an icon saying so. Both
 * the landing page and the dossier open every section this way.
 */
export function SectionBand({
  id,
  index,
  kicker,
  title,
  lede,
  action,
}: Readonly<{
  id: string;
  index: string;
  kicker: string;
  title: string;
  lede?: string;
  action?: React.ReactNode;
}>) {
  return (
    <header className="meta-band">
      <p className="meta-band-label">
        <span className="meta-index">{index}</span>
        <span className="meta-rule" aria-hidden="true" />
        <span className="meta-kicker">{kicker}</span>
      </p>
      <div className="meta-band-body">
        <div className="meta-band-lead">
          <h2 id={id}>{title}</h2>
          {/* With no lede there is nothing to sit beside, so the door belongs
              under the title rather than floating at the far right. */}
          {action && !lede ? <div className="meta-band-action">{action}</div> : null}
        </div>
        {lede ? (
          <div className="meta-band-aside">
            <p>{lede}</p>
            {action}
          </div>
        ) : null}
      </div>
    </header>
  );
}

/** One record, shown as evidence rather than described as a claim. */
export function SpecimenCard() {
  const t = useTranslations("meta");

  return (
    <article className="meta-specimen">
      <div className="meta-specimen-top">
        <p className="meta-specimen-code">{t("specimenCode")}</p>
        <p className="meta-specimen-status">{t("specimenMeta")}</p>
      </div>
      <h3 className="meta-specimen-title">{t("specimenTitle")}</h3>
      <blockquote className="meta-specimen-text">
        <p>{t("specimenText")}</p>
      </blockquote>
      <footer className="meta-specimen-foot">
        <Link className="meta-specimen-link" href={`/site/records/${t("specimenCode")}`}>
          {t("specimenLink")}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </footer>
    </article>
  );
}

const EDITIONS = [
  {
    tone: "reading",
    index: "readingIndex",
    title: "readingTitle",
    body: "readingBody",
    note: "readingNote",
    link: "readingLink",
    href: "/site",
  },
  {
    tone: "workstation",
    index: "workstationIndex",
    title: "workstationTitle",
    body: "workstationBody",
    note: "workstationNote",
    link: "workstationLink",
    href: "/desktop",
  },
] as const;

export function EditionCards() {
  const t = useTranslations("meta");

  return (
    <div className="meta-editions">
      {EDITIONS.map((edition) => (
        <article className="meta-edition" data-tone={edition.tone} key={edition.tone}>
          <p className="meta-edition-figure" aria-hidden="true">
            {t(edition.index)}
          </p>
          <p className="meta-edition-kicker">{t(edition.note)}</p>
          <h3>{t(edition.title)}</h3>
          <p className="meta-edition-body">{t(edition.body)}</p>
          <Link className="meta-edition-link" href={edition.href}>
            {t(edition.link)}
            <ArrowRight aria-hidden="true" size={15} />
          </Link>
        </article>
      ))}
    </div>
  );
}

/** The count is a fact about the corpus, not a translated string. */
export const RECORD_COUNT = String(ARCHIVE_INDEX.length).padStart(2, "0");
