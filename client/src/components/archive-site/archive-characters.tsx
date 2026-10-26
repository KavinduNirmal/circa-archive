import { useTranslations } from "next-intl";
import { ArchiveReserved } from "./archive-reserved";

/**
 * The characters directory.
 *
 * Character dossiers open by code through the API-backed route, but the reading
 * edition serves no directory of them yet. The section is named in the navigation
 * so the address exists; it explains the reservation and returns the reader to
 * the index instead of inventing a roster.
 */
export function ArchiveCharacters() {
  const t = useTranslations("site");
  return (
    <ArchiveReserved
      active="characters"
      trail={[{ label: t("trailCharacters") }]}
      title={t("charactersTitle")}
      lede={t("charactersLede")}
      note={t("charactersNote")}
      backLabel={t("recordBack")}
    />
  );
}
