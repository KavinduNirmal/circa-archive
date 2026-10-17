/**
 * The documentation's shape: groups, topics, and the section anchors that appear
 * in each page's table of contents.
 *
 * This module holds identifiers and message keys, never prose. The copy lives in
 * the `meta` catalog in both languages, which is what keeps a page and its
 * translation from drifting apart. The topic order here is also the reading
 * order: the sidebar, the previous/next pager, and `generateStaticParams` all
 * read it from this one list.
 */

export const DOC_GROUPS = [
  { id: "start", labelKey: "docsGroupStart", slugs: ["overview", "getting-started", "project-structure"] },
  { id: "archive", labelKey: "docsGroupArchive", slugs: ["records", "rendering", "routes"] },
  { id: "project", labelKey: "docsGroupProject", slugs: ["contributing", "testing", "design"] },
] as const;

export type DocSection = Readonly<{ id: string; titleKey: string }>;

export type DocTopic = Readonly<{
  slug: string;
  group: (typeof DOC_GROUPS)[number]["id"];
  /** The sidebar label. Short, because the sidebar is narrow. */
  navKey: string;
  titleKey: string;
  ledeKey: string;
  sections: readonly DocSection[];
}>;

const sections = (...entries: readonly [string, string][]): DocSection[] =>
  entries.map(([id, titleKey]) => ({ id, titleKey }));

export const DOC_TOPICS: readonly DocTopic[] = [
  {
    slug: "overview",
    group: "start",
    navKey: "docsOverviewNav",
    titleKey: "docsOverviewTitle",
    ledeKey: "docsOverviewLede",
    sections: sections(
      ["what", "docsOverviewWhatTitle"],
      ["editions", "docsOverviewEditionsTitle"],
      ["status", "docsOverviewStatusTitle"],
      ["reading", "docsOverviewReadingTitle"],
    ),
  },
  {
    slug: "getting-started",
    group: "start",
    navKey: "docsGettingStartedNav",
    titleKey: "docsGettingStartedTitle",
    ledeKey: "docsGettingStartedLede",
    sections: sections(
      ["requirements", "docsGettingStartedRequirementsTitle"],
      ["install", "docsGettingStartedInstallTitle"],
      ["run", "docsGettingStartedRunTitle"],
      ["verify", "docsGettingStartedVerifyTitle"],
      ["trouble", "docsGettingStartedTroubleTitle"],
    ),
  },
  {
    slug: "project-structure",
    group: "start",
    navKey: "docsStructureNav",
    titleKey: "docsStructureTitle",
    ledeKey: "docsStructureLede",
    sections: sections(
      ["tree", "docsStructureTreeTitle"],
      ["client", "docsStructureClientTitle"],
      ["content", "docsStructureContentTitle"],
      ["readme", "docsStructureReadmeTitle"],
    ),
  },
  {
    slug: "records",
    group: "archive",
    navKey: "docsRecordsNav",
    titleKey: "docsRecordsTitle",
    ledeKey: "docsRecordsLede",
    sections: sections(
      ["anatomy", "docsRecordsAnatomyTitle"],
      ["frontmatter", "docsRecordsFrontmatterTitle"],
      ["sections", "docsRecordsSectionsTitle"],
      ["syntax", "docsRecordsSyntaxTitle"],
      ["where", "docsRecordsWhereTitle"],
    ),
  },
  {
    slug: "rendering",
    group: "archive",
    navKey: "docsRenderingNav",
    titleKey: "docsRenderingTitle",
    ledeKey: "docsRenderingLede",
    sections: sections(
      ["pipeline", "docsRenderingPipelineTitle"],
      ["plugins", "docsRenderingPluginsTitle"],
      ["warnings", "docsRenderingWarningsTitle"],
      ["exports", "docsRenderingExportsTitle"],
      ["boundaries", "docsRenderingBoundariesTitle"],
    ),
  },
  {
    slug: "routes",
    group: "archive",
    navKey: "docsRoutesNav",
    titleKey: "docsRoutesTitle",
    ledeKey: "docsRoutesLede",
    sections: sections(
      ["map", "docsRoutesMapTitle"],
      ["language", "docsRoutesLanguageTitle"],
      ["editions", "docsRoutesEditionsTitle"],
      ["adding", "docsRoutesAddingTitle"],
    ),
  },
  {
    slug: "contributing",
    group: "project",
    navKey: "docsContributingNav",
    titleKey: "docsContributingTitle",
    ledeKey: "docsContributingLede",
    sections: sections(
      ["before", "docsContributingBeforeTitle"],
      ["branch", "docsContributingBranchTitle"],
      ["checks", "docsContributingChecksTitle"],
      ["docs", "docsContributingDocsTitle"],
      ["pull", "docsContributingPullTitle"],
    ),
  },
  {
    slug: "testing",
    group: "project",
    navKey: "docsTestingNav",
    titleKey: "docsTestingTitle",
    ledeKey: "docsTestingLede",
    sections: sections(
      ["rhythm", "docsTestingRhythmTitle"],
      ["unit", "docsTestingUnitTitle"],
      ["catalog", "docsTestingCatalogTitle"],
      ["e2e", "docsTestingE2eTitle"],
      ["coverage", "docsTestingCoverageTitle"],
    ),
  },
  {
    slug: "design",
    group: "project",
    navKey: "docsDesignNav",
    titleKey: "docsDesignTitle",
    ledeKey: "docsDesignLede",
    sections: sections(
      ["systems", "docsDesignSystemsTitle"],
      ["tokens", "docsDesignTokensTitle"],
      ["patterns", "docsDesignPatternsTitle"],
      ["access", "docsDesignAccessTitle"],
      ["adding", "docsDesignAddingTitle"],
    ),
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
