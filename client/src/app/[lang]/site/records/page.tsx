import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArchiveRecords } from "@/components/archive-site/archive-records";
import { SEARCH_ENABLED_TYPES } from "@/lib/search/contract";
import type { SearchVocabulary } from "@/lib/search/fixture";
import { getSearchResults } from "@/lib/search/api";
import {
  parseSearchState,
  searchQueryNotices,
  toSearchHref,
  type SearchParamsInput,
} from "@/lib/search/query";

type RecordsPageProps = Readonly<{
  params: Promise<{ lang: string }>;
  searchParams: Promise<SearchParamsInput>;
}>;

export async function generateMetadata({
  params,
  searchParams,
}: RecordsPageProps): Promise<Metadata> {
  const { lang } = await params;
  const state = parseSearchState(await searchParams);
  const t = await getTranslations({ locale: lang, namespace: "metadata" });
  const filtered = Boolean(
    state.q ||
    state.holder ||
    state.mention ||
    state.org ||
    state.author ||
    state.tag ||
    state.character ||
    state.custody ||
    state.cursor ||
    state.types.length ||
    state.classes.length ||
    state.statuses.length ||
    state.warnings.length ||
    state.disclosures.length ||
    state.warningTags.length ||
    state.excludedWarningTags.length ||
    state.period !== "any" ||
    state.from ||
    state.to ||
    state.language !== "en" ||
    state.sort !== "newest" ||
    state.page > 1 ||
    state.limit !== 20,
  );
  return {
    title: {
      absolute: state.q
        ? `${t("siteRecordsTitle")}: “${state.q}”`
        : t("siteRecordsTitle"),
    },
    description: t("siteRecordsDescription"),
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function RecordsPage({
  params,
  searchParams,
}: RecordsPageProps) {
  const { lang } = await params;
  setRequestLocale(lang);
  const input = await searchParams;
  const state = parseSearchState(input);
  if (Object.values(input).some((value) => value === ""))
    redirect(`/${lang}${toSearchHref(state)}`);
  state.types = state.types.filter((type) =>
    SEARCH_ENABLED_TYPES.includes(
      type as (typeof SEARCH_ENABLED_TYPES)[number],
    ),
  );
  const t = await getTranslations({
    locale: state.language,
    namespace: "site",
  });
  const vocabulary: SearchVocabulary = {
    types: {
      incident: t("searchOptionIncident"),
      record: t("searchOptionRecord"),
      organization: t("searchOptionOrganization"),
      character: t("searchOptionCharacter"),
      recovery: t("searchOptionRecovery"),
    },
    classes: {
      incident: t("searchOptionIncident"),
      exploration: t("searchOptionExploration"),
      evidence: t("searchOptionEvidence"),
      rumour: t("searchOptionRumour"),
    },
    statuses: {
      "on-file": t("searchOptionOnFile"),
      contested: t("searchOptionContested"),
      sealed: t("searchOptionSealed"),
      restricted: t("searchOptionRestricted"),
      erased: t("searchOptionErased"),
      tombstoned: t("searchOptionTombstoned"),
    },
    warningTiers: {
      red: t("searchOptionRed"),
      yellow: t("searchOptionYellow"),
      green: t("searchOptionGreen"),
    },
    disclosures: {
      none: t("searchOptionNone"),
      "no-warnings-apply": t("searchOptionNoWarningsApply"),
      "not-provided": t("searchOptionNotProvided"),
    },
    warningTags: {
      "graphic-violence": t("searchOptionGraphicViolence"),
      "psychological-horror": t("searchOptionPsychologicalHorror"),
      "sexual-violence": t("searchOptionSexualViolence"),
      "self-harm": t("searchOptionSelfHarm"),
      "major-character-death": t("searchOptionMajorCharacterDeath"),
    },
  };
  const outcome = await getSearchResults(state, vocabulary);
  return (
    <ArchiveRecords
      state={state}
      outcome={outcome}
      notices={searchQueryNotices(input)}
    />
  );
}
