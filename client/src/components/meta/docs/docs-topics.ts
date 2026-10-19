/** Localized navigation and reading order. Article content and headings live in GitHub Markdown. */

export const DOC_GROUPS = [
  { id: "start", labelKey: "docsGroupStart", slugs: ["overview", "getting-started", "project-structure"] },
  { id: "archive", labelKey: "docsGroupArchive", slugs: ["records", "rendering", "routes"] },
  { id: "project", labelKey: "docsGroupProject", slugs: ["contributing", "testing", "design"] },
  { id: "author", labelKey: "docsGroupAuthor", slugs: ["author-guide"] },
  {
    id: "lore",
    labelKey: "docsGroupLore",
    slugs: [
      "lore",
      "lore-anatomy",
      "lore-rules",
      "lore-narrative-flow",
      "lore-nested-incidents",
      "lore-circa",
      "lore-anomalies",
      "lore-phenomena",
      "lore-independent-entities",
      "lore-classifications",
      "lore-anchors",
      "lore-entry",
      "lore-time",
      "lore-participation",
      "lore-outcomes",
      "lore-archive-index",
      "lore-explorations",
      "lore-civilians",
      "lore-anonymity",
      "lore-recoveries",
      "lore-corruption",
      "lore-narrative-assimilation",
      "lore-witness-sheets",
      "lore-witness-pen",
      "lore-lasting-bamboo",
      "lore-recollection-projector",
      "lore-records",
      "lore-organizations",
      "lore-continuities",
    ],
  },
] as const;

export type DocTopic = Readonly<{
  slug: string;
  group: (typeof DOC_GROUPS)[number]["id"];
  /** The sidebar label. Short, because the sidebar is narrow. */
  navKey: string;
  titleKey: string;
  ledeKey: string;
  sourceFile?: string;
}>;

export const DOC_TOPICS: readonly DocTopic[] = [
  {
    slug: "overview",
    group: "start",
    navKey: "docsOverviewNav",
    titleKey: "docsOverviewTitle",
    ledeKey: "docsOverviewLede",
  },
  {
    slug: "getting-started",
    group: "start",
    navKey: "docsGettingStartedNav",
    titleKey: "docsGettingStartedTitle",
    ledeKey: "docsGettingStartedLede",
  },
  {
    slug: "project-structure",
    group: "start",
    navKey: "docsStructureNav",
    titleKey: "docsStructureTitle",
    ledeKey: "docsStructureLede",
  },
  {
    slug: "records",
    group: "archive",
    navKey: "docsRecordsNav",
    titleKey: "docsRecordsTitle",
    ledeKey: "docsRecordsLede",
  },
  {
    slug: "rendering",
    group: "archive",
    navKey: "docsRenderingNav",
    titleKey: "docsRenderingTitle",
    ledeKey: "docsRenderingLede",
  },
  {
    slug: "routes",
    group: "archive",
    navKey: "docsRoutesNav",
    titleKey: "docsRoutesTitle",
    ledeKey: "docsRoutesLede",
  },
  {
    slug: "contributing",
    group: "project",
    navKey: "docsContributingNav",
    titleKey: "docsContributingTitle",
    ledeKey: "docsContributingLede",
  },
  {
    slug: "testing",
    group: "project",
    navKey: "docsTestingNav",
    titleKey: "docsTestingTitle",
    ledeKey: "docsTestingLede",
  },
  {
    slug: "design",
    group: "project",
    navKey: "docsDesignNav",
    titleKey: "docsDesignTitle",
    ledeKey: "docsDesignLede",
  },
  {
    slug: "author-guide",
    group: "author",
    navKey: "docsAuthorGuideNav",
    titleKey: "docsAuthorGuideTitle",
    ledeKey: "docsAuthorGuideLede",
    sourceFile: "docs/AUTHOR_GUIDE.md",
  },
  {
    slug: "lore",
    group: "lore",
    navKey: "docsLoreNav",
    titleKey: "docsLoreTitle",
    ledeKey: "docsLoreLede",
    sourceFile: "docs/lore/README.md",
  },
  {
    slug: "lore-anatomy",
    group: "lore",
    navKey: "docsLoreAnatomyNav",
    titleKey: "docsLoreAnatomyTitle",
    ledeKey: "docsLoreAnatomyLede",
    sourceFile: "docs/lore/Anatomy.md",
  },
  {
    slug: "lore-rules",
    group: "lore",
    navKey: "docsLoreRulesNav",
    titleKey: "docsLoreRulesTitle",
    ledeKey: "docsLoreRulesLede",
    sourceFile: "docs/lore/Rules.md",
  },
  {
    slug: "lore-narrative-flow",
    group: "lore",
    navKey: "docsLoreNarrativeFlowNav",
    titleKey: "docsLoreNarrativeFlowTitle",
    ledeKey: "docsLoreNarrativeFlowLede",
    sourceFile: "docs/lore/Narrative flow.md",
  },
  {
    slug: "lore-nested-incidents",
    group: "lore",
    navKey: "docsLoreNestedIncidentsNav",
    titleKey: "docsLoreNestedIncidentsTitle",
    ledeKey: "docsLoreNestedIncidentsLede",
    sourceFile: "docs/lore/Nested incidents.md",
  },
  {
    slug: "lore-circa",
    group: "lore",
    navKey: "docsLoreCircaNav",
    titleKey: "docsLoreCircaTitle",
    ledeKey: "docsLoreCircaLede",
    sourceFile: "docs/lore/C.I.R.C.A.md",
  },
  {
    slug: "lore-anomalies",
    group: "lore",
    navKey: "docsLoreAnomaliesNav",
    titleKey: "docsLoreAnomaliesTitle",
    ledeKey: "docsLoreAnomaliesLede",
    sourceFile: "docs/lore/Anomalies.md",
  },
  {
    slug: "lore-phenomena",
    group: "lore",
    navKey: "docsLorePhenomenaNav",
    titleKey: "docsLorePhenomenaTitle",
    ledeKey: "docsLorePhenomenaLede",
    sourceFile: "docs/lore/Phenomena.md",
  },
  {
    slug: "lore-independent-entities",
    group: "lore",
    navKey: "docsLoreIndependentEntitiesNav",
    titleKey: "docsLoreIndependentEntitiesTitle",
    ledeKey: "docsLoreIndependentEntitiesLede",
    sourceFile: "docs/lore/Independent entities.md",
  },
  {
    slug: "lore-classifications",
    group: "lore",
    navKey: "docsLoreClassificationsNav",
    titleKey: "docsLoreClassificationsTitle",
    ledeKey: "docsLoreClassificationsLede",
    sourceFile: "docs/lore/Classifications.md",
  },
  {
    slug: "lore-anchors",
    group: "lore",
    navKey: "docsLoreAnchorsNav",
    titleKey: "docsLoreAnchorsTitle",
    ledeKey: "docsLoreAnchorsLede",
    sourceFile: "docs/lore/Anchors.md",
  },
  {
    slug: "lore-entry",
    group: "lore",
    navKey: "docsLoreEntryNav",
    titleKey: "docsLoreEntryTitle",
    ledeKey: "docsLoreEntryLede",
    sourceFile: "docs/lore/Entry.md",
  },
  {
    slug: "lore-time",
    group: "lore",
    navKey: "docsLoreTimeNav",
    titleKey: "docsLoreTimeTitle",
    ledeKey: "docsLoreTimeLede",
    sourceFile: "docs/lore/Time.md",
  },
  {
    slug: "lore-participation",
    group: "lore",
    navKey: "docsLoreParticipationNav",
    titleKey: "docsLoreParticipationTitle",
    ledeKey: "docsLoreParticipationLede",
    sourceFile: "docs/lore/Participation.md",
  },
  {
    slug: "lore-outcomes",
    group: "lore",
    navKey: "docsLoreOutcomesNav",
    titleKey: "docsLoreOutcomesTitle",
    ledeKey: "docsLoreOutcomesLede",
    sourceFile: "docs/lore/Outcomes.md",
  },
  {
    slug: "lore-archive-index",
    group: "lore",
    navKey: "docsLoreArchiveIndexNav",
    titleKey: "docsLoreArchiveIndexTitle",
    ledeKey: "docsLoreArchiveIndexLede",
    sourceFile: "docs/lore/Archive index.md",
  },
  {
    slug: "lore-explorations",
    group: "lore",
    navKey: "docsLoreExplorationsNav",
    titleKey: "docsLoreExplorationsTitle",
    ledeKey: "docsLoreExplorationsLede",
    sourceFile: "docs/lore/Explorations.md",
  },
  {
    slug: "lore-civilians",
    group: "lore",
    navKey: "docsLoreCiviliansNav",
    titleKey: "docsLoreCiviliansTitle",
    ledeKey: "docsLoreCiviliansLede",
    sourceFile: "docs/lore/Civilians.md",
  },
  {
    slug: "lore-anonymity",
    group: "lore",
    navKey: "docsLoreAnonymityNav",
    titleKey: "docsLoreAnonymityTitle",
    ledeKey: "docsLoreAnonymityLede",
    sourceFile: "docs/lore/Anonymity.md",
  },
  {
    slug: "lore-recoveries",
    group: "lore",
    navKey: "docsLoreRecoveriesNav",
    titleKey: "docsLoreRecoveriesTitle",
    ledeKey: "docsLoreRecoveriesLede",
    sourceFile: "docs/lore/Recoveries.md",
  },
  {
    slug: "lore-corruption",
    group: "lore",
    navKey: "docsLoreCorruptionNav",
    titleKey: "docsLoreCorruptionTitle",
    ledeKey: "docsLoreCorruptionLede",
    sourceFile: "docs/lore/Corruption.md",
  },
  {
    slug: "lore-narrative-assimilation",
    group: "lore",
    navKey: "docsLoreNarrativeAssimilationNav",
    titleKey: "docsLoreNarrativeAssimilationTitle",
    ledeKey: "docsLoreNarrativeAssimilationLede",
    sourceFile: "docs/lore/Narrative Assimilation.md",
  },
  {
    slug: "lore-witness-sheets",
    group: "lore",
    navKey: "docsLoreWitnessSheetsNav",
    titleKey: "docsLoreWitnessSheetsTitle",
    ledeKey: "docsLoreWitnessSheetsLede",
    sourceFile: "docs/lore/Witness sheets.md",
  },
  {
    slug: "lore-witness-pen",
    group: "lore",
    navKey: "docsLoreWitnessPenNav",
    titleKey: "docsLoreWitnessPenTitle",
    ledeKey: "docsLoreWitnessPenLede",
    sourceFile: "docs/lore/Witness Pen.md",
  },
  {
    slug: "lore-lasting-bamboo",
    group: "lore",
    navKey: "docsLoreLastingBambooNav",
    titleKey: "docsLoreLastingBambooTitle",
    ledeKey: "docsLoreLastingBambooLede",
    sourceFile: "docs/lore/Lasting Bamboo.md",
  },
  {
    slug: "lore-recollection-projector",
    group: "lore",
    navKey: "docsLoreRecollectionProjectorNav",
    titleKey: "docsLoreRecollectionProjectorTitle",
    ledeKey: "docsLoreRecollectionProjectorLede",
    sourceFile: "docs/lore/Recollection Projector.md",
  },
  {
    slug: "lore-records",
    group: "lore",
    navKey: "docsLoreRecordsNav",
    titleKey: "docsLoreRecordsTitle",
    ledeKey: "docsLoreRecordsLede",
    sourceFile: "docs/lore/Records.md",
  },
  {
    slug: "lore-organizations",
    group: "lore",
    navKey: "docsLoreOrganizationsNav",
    titleKey: "docsLoreOrganizationsTitle",
    ledeKey: "docsLoreOrganizationsLede",
    sourceFile: "docs/lore/Organizations.md",
  },
  {
    slug: "lore-continuities",
    group: "lore",
    navKey: "docsLoreContinuitiesNav",
    titleKey: "docsLoreContinuitiesTitle",
    ledeKey: "docsLoreContinuitiesLede",
    sourceFile: "docs/lore/Continuities.md",
  },
] as const;

export const DOC_SLUGS = DOC_TOPICS.map((topic) => topic.slug);

export function docTopic(slug: string): DocTopic | undefined {
  return DOC_TOPICS.find((topic) => topic.slug === slug);
}

/** The overview is the section's front door, so it keeps the short address. */
export function docHref(slug: string): string {
  return slug === "overview" ? "/meta/documentation" : `/meta/documentation/${slug}`;
}

export function docNeighbours(slug: string): { previous?: DocTopic; next?: DocTopic } {
  const index = DOC_TOPICS.findIndex((topic) => topic.slug === slug);
  if (index === -1) return {};
  return { previous: DOC_TOPICS[index - 1], next: DOC_TOPICS[index + 1] };
}
