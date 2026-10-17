import { ArrowRight, Info, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { DocTopic } from "./docs-topics";
import { docHref } from "./docs-topics";
import { CopyCode } from "./copy-code";

/**
 * The body of each documentation page.
 *
 * Headings and anchors come from `docs-topics.ts`; this file supplies the prose
 * and the examples for the section ids declared there. That keeps the table of
 * contents, the sidebar, and the page in one order without a second source of
 * truth. All copy is read from the `meta` catalog.
 */

type DocTranslator = (key: string) => string;

function DocCallout({
  tone = "note",
  title,
  children,
}: Readonly<{ tone?: "note" | "warning"; title: string; children: React.ReactNode }>) {
  const Icon = tone === "warning" ? TriangleAlert : Info;
  return (
    <aside className="meta-doc-callout" data-tone={tone}>
      <p className="meta-doc-callout-title">
        <Icon aria-hidden="true" size={14} />
        {title}
      </p>
      <div className="meta-doc-callout-body">{children}</div>
    </aside>
  );
}

function DocTable({
  caption,
  head,
  rows,
}: Readonly<{ caption: string; head: readonly string[]; rows: readonly (readonly React.ReactNode[])[] }>) {
  return (
    <div className="meta-doc-table-wrap" role="region" aria-label={caption} tabIndex={0}>
      <table className="meta-doc-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {head.map((cell) => (
              <th scope="col" key={cell}>
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) =>
                cellIndex === 0 ? (
                  <th scope="row" key={cellIndex}>
                    {cell}
                  </th>
                ) : (
                  <td key={cellIndex}>{cell}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DocCode({ t, code, label, language }: Readonly<{ t: DocTranslator; code: string; label: string; language?: string }>) {
  return (
    <CopyCode
      code={code}
      label={label}
      language={language}
      copyLabel={t("docsCopy")}
      copiedLabel={t("docsCopied")}
      failedLabel={t("docsCopyFailed")}
    />
  );
}

function DocCards({
  items,
}: Readonly<{ items: readonly { title: string; body: string; href: string; label: string }[] }>) {
  return (
    <div className="meta-doc-start-grid">
      {items.map((item, index) => (
        <Link className="meta-doc-start" href={item.href} key={item.href}>
          <span className="meta-doc-start-index" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3>{item.title}</h3>
          <p>{item.body}</p>
          <span className="meta-doc-start-link">
            {item.label}
            <ArrowRight aria-hidden="true" size={14} />
          </span>
        </Link>
      ))}
    </div>
  );
}

function P({ children }: Readonly<{ children: React.ReactNode }>) {
  return <p className="meta-doc-p">{children}</p>;
}

function C({ children }: Readonly<{ children: React.ReactNode }>) {
  return <code className="meta-inline-code">{children}</code>;
}

const TREE_CODE = `circa/
├── client/           the Next.js interface
├── backend/          reserved for .NET services
├── admin/            reserved for administration
├── docs/             planning and the open-source checklist
├── scripts/          repository checks
├── tests/            root tooling tests
├── ARCHITECTURE.md   draft platform design
└── .agents/brain/    product context and design specification`;

const RECORD_CODE = `---
circa_code: CIRCA-S-03007
incident_ref: INC-03007
title: The Unwalled Door
type: DISCOVERY
status: FILED
severity: S
originator: H. Kim
filed_date: 2004-09-12
last_revision: 2004-09-14
classification: LEVEL 3
clearance: REVIEWER
related:
  - INC-00907
tags:
  - door
---

# The Unwalled Door

## Brief

A free-standing door in a pasture in Gangwon Province.`;

const PIPELINE_CODE = `import { parseRecord } from "@/lib/markdown/pipeline";
import { renderText } from "@/lib/markdown/emitters/to-text";

const parsed = parseRecord({ markdown, assetBaseUrl });
const text = renderText({ markdown }).output;`;

const ROUTE_CODE = `export default async function Page({ params }: Props) {
  const { lang } = await params;
  setRequestLocale(lang);
  return <SomeSurface />;
}`;

function sectionBody(slug: string, id: string, t: DocTranslator): React.ReactNode {
  switch (`${slug}:${id}`) {
    /* ------------------------------------------------------------ overview */
    case "overview:what":
      return (
        <>
          <P>{t("docsOverviewWhatBody")}</P>
          <P>{t("docsOverviewWhatBodyTwo")}</P>
          <DocCallout title={t("docsOverviewWhatCalloutTitle")}>
            <p>{t("docsOverviewWhatCalloutBody")}</p>
          </DocCallout>
          <DocCards
            items={[
              {
                title: t("docsStartCard1Title"),
                body: t("docsStartCard1Body"),
                href: docHref("getting-started"),
                label: t("docsStartCard1Link"),
              },
              {
                title: t("docsStartCard2Title"),
                body: t("docsStartCard2Body"),
                href: docHref("records"),
                label: t("docsStartCard2Link"),
              },
              {
                title: t("docsStartCard3Title"),
                body: t("docsStartCard3Body"),
                href: docHref("contributing"),
                label: t("docsStartCard3Link"),
              },
            ]}
          />
        </>
      );
    case "overview:editions":
      return (
        <>
          <P>{t("docsOverviewEditionsBody")}</P>
          <ul className="meta-doc-list">
            <li>
              <strong>{t("docsOverviewEditionsReadingTitle")}</strong> {t("docsOverviewEditionsReadingBody")}
            </li>
            <li>
              <strong>{t("docsOverviewEditionsWorkstationTitle")}</strong> {t("docsOverviewEditionsWorkstationBody")}
            </li>
            <li>
              <strong>{t("docsOverviewEditionsProjectTitle")}</strong> {t("docsOverviewEditionsProjectBody")}
            </li>
          </ul>
          <P>{t("docsOverviewEditionsBodyTwo")}</P>
        </>
      );
    case "overview:status":
      return (
        <>
          <P>{t("docsOverviewStatusBody")}</P>
          <ul className="meta-doc-list">
            <li>
              <strong>{t("docsOverviewStatusBuiltLabel")}</strong> {t("docsOverviewStatusBuilt")}
            </li>
            <li>
              <strong>{t("docsOverviewStatusNotBuiltLabel")}</strong> {t("docsOverviewStatusNotBuilt")}
            </li>
            <li>
              <strong>{t("docsOverviewStatusPlannedLabel")}</strong> {t("docsOverviewStatusPlanned")}
            </li>
          </ul>
          <DocCallout tone="warning" title={t("docsOverviewStatusCalloutTitle")}>
            <p>{t("docsOverviewStatusCalloutBody")}</p>
          </DocCallout>
        </>
      );
    case "overview:reading":
      return (
        <>
          <P>{t("docsOverviewReadingBody")}</P>
          <P>{t("docsOverviewReadingBodyTwo")}</P>
          <P>
            {t("docsOverviewReadingBodyThree")}{" "}
            <Link className="meta-doc-inline-link" href={docHref("contributing")}>
              {t("docsOverviewReadingLink")}
            </Link>
          </P>
        </>
      );

    /* ----------------------------------------------------- getting started */
    case "getting-started:requirements":
      return (
        <>
          <P>{t("docsGettingStartedRequirementsBody")}</P>
          <ul className="meta-doc-list">
            <li>{t("docsGettingStartedRequirementsOne")}</li>
            <li>{t("docsGettingStartedRequirementsTwo")}</li>
            <li>{t("docsGettingStartedRequirementsThree")}</li>
            <li>{t("docsGettingStartedRequirementsFour")}</li>
          </ul>
          <DocCallout title={t("docsGettingStartedRequirementsCalloutTitle")}>
            <p>{t("docsGettingStartedRequirementsCalloutBody")}</p>
          </DocCallout>
        </>
      );
    case "getting-started:install":
      return (
        <>
          <P>{t("docsGettingStartedInstallBody")}</P>
          <DocCode
            t={t}
            label={t("docsGettingStartedInstallLabel")}
            language="sh"
            code={`git clone <repository>
cd circa
bun install --frozen-lockfile
bun run prepare
cd client && bun install --frozen-lockfile`}
          />
          <P>{t("docsGettingStartedInstallBodyTwo")}</P>
        </>
      );
    case "getting-started:run":
      return (
        <>
          <P>{t("docsGettingStartedRunBody")}</P>
          <DocCode
            t={t}
            label={t("docsGettingStartedRunLabel")}
            language="sh"
            code={`bun run --cwd=client dev
# http://localhost:3001 -> /en`}
          />
          <DocTable
            caption={t("docsGettingStartedRunTableCaption")}
            head={[t("docsGettingStartedRunRouteHead"), t("docsGettingStartedRunSurfaceHead")]}
            rows={[
              [<C key="portal">/en</C>, t("docsGettingStartedRunPortal")],
              [<C key="site">/en/site</C>, t("docsGettingStartedRunSite")],
              [<C key="meta">/en/meta</C>, t("docsGettingStartedRunMeta")],
              [<C key="docs">/en/meta/documentation</C>, t("docsGettingStartedRunDocs")],
              [<C key="desktop">/en/desktop</C>, t("docsGettingStartedRunDesktop")],
            ]}
          />
          <P>{t("docsGettingStartedRunBodyTwo")}</P>
        </>
      );
    case "getting-started:verify":
      return (
        <>
          <P>{t("docsGettingStartedVerifyBody")}</P>
          <DocCode
            t={t}
            label={t("docsGettingStartedVerifyLabel")}
            language="sh"
            code={`bun run check        # every authored folder has a README
bun run test         # root tooling tests
bun run check:client # lint, typecheck, unit tests
bun run precommit    # all of the above, staged first`}
          />
          <DocCallout title={t("docsGettingStartedVerifyCalloutTitle")}>
            <p>{t("docsGettingStartedVerifyCalloutBody")}</p>
          </DocCallout>
        </>
      );
    case "getting-started:trouble":
      return (
        <>
          <P>{t("docsGettingStartedTroubleBody")}</P>
          <ul className="meta-doc-list">
            <li>{t("docsGettingStartedTroubleOne")}</li>
            <li>{t("docsGettingStartedTroubleTwo")}</li>
            <li>{t("docsGettingStartedTroubleThree")}</li>
          </ul>
          <P>{t("docsGettingStartedTroubleBodyTwo")}</P>
        </>
      );

    /* --------------------------------------------------- project structure */
    case "project-structure:tree":
      return (
        <>
          <P>{t("docsStructureTreeBody")}</P>
          <DocCode t={t} label={t("docsStructureTreeLabel")} language="text" code={TREE_CODE} />
          <P>{t("docsStructureTreeBodyTwo")}</P>
        </>
      );
    case "project-structure:client":
      return (
        <>
          <P>{t("docsStructureClientBody")}</P>
          <ul className="meta-doc-list">
            <li>{t("docsStructureClientOne")}</li>
            <li>{t("docsStructureClientTwo")}</li>
            <li>{t("docsStructureClientThree")}</li>
            <li>{t("docsStructureClientFour")}</li>
            <li>{t("docsStructureClientFive")}</li>
          </ul>
          <P>{t("docsStructureClientBodyTwo")}</P>
        </>
      );
    case "project-structure:content":
      return (
        <>
          <P>{t("docsStructureContentBody")}</P>
          <DocTable
            caption={t("docsStructureContentCaption")}
            head={[
              t("docsStructureContentKindHead"),
              t("docsStructureContentLivesHead"),
              t("docsStructureContentTranslatedHead"),
            ]}
            rows={[
              [t("docsStructureContentChrome"), <C key="messages">messages/&lt;locale&gt;/*.json</C>, t("docsStructureContentYes")],
              [t("docsStructureContentFiled"), <C key="index">*-index.ts, *-sources.ts</C>, t("docsStructureContentNo")],
              [t("docsStructureContentProject"), <C key="meta">messages/&lt;locale&gt;/meta.json</C>, t("docsStructureContentYes")],
              [t("docsStructureContentIdentifiers"), t("docsStructureContentCode"), t("docsStructureContentNo")],
            ]}
          />
          <P>{t("docsStructureContentBodyTwo")}</P>
        </>
      );
    case "project-structure:readme":
      return (
        <>
          <P>{t("docsStructureReadmeBody")}</P>
          <P>{t("docsStructureReadmeBodyTwo")}</P>
        </>
      );

    /* ---------------------------------------------------------------- records */
    case "records:anatomy":
      return (
        <>
          <P>{t("docsRecordsAnatomyBody")}</P>
          <DocCode t={t} label={t("docsRecordsAnatomyLabel")} language="markdown" code={RECORD_CODE} />
          <DocCallout title={t("docsRecordsAnatomyCalloutTitle")}>
            <p>{t("docsRecordsAnatomyCalloutBody")}</p>
          </DocCallout>
        </>
      );
    case "records:frontmatter":
      return (
        <>
          <P>{t("docsRecordsFrontmatterBody")}</P>
          <DocTable
            caption={t("docsRecordsFrontmatterCaption")}
            head={[t("docsRecordsFrontmatterFieldHead"), t("docsRecordsFrontmatterMeaningHead")]}
            rows={[
              [<C key="a">circa_code</C>, t("docsRecordsFrontmatterCode")],
              [<C key="b">incident_ref</C>, t("docsRecordsFrontmatterIncident")],
              [<C key="c">title</C>, t("docsRecordsFrontmatterTitleRow")],
              [<C key="d">type</C>, t("docsRecordsFrontmatterTypeRow")],
              [<C key="e">status</C>, t("docsRecordsFrontmatterStatusRow")],
              [<C key="f">severity</C>, t("docsRecordsFrontmatterSeverity")],
              [<C key="g">originator</C>, t("docsRecordsFrontmatterOriginator")],
              [<C key="h">filed_date</C>, t("docsRecordsFrontmatterDates")],
              [<C key="i">classification</C>, t("docsRecordsFrontmatterClassification")],
              [<C key="j">related / tags</C>, t("docsRecordsFrontmatterRelated")],
            ]}
          />
        </>
      );
    case "records:sections":
      return (
        <>
          <P>{t("docsRecordsSectionsBody")}</P>
          <P>{t("docsRecordsSectionsBodyTwo")}</P>
          <DocCallout tone="warning" title={t("docsRecordsSectionsCalloutTitle")}>
            <p>{t("docsRecordsSectionsCalloutBody")}</p>
          </DocCallout>
        </>
      );
    case "records:syntax":
      return (
        <>
          <P>{t("docsRecordsSyntaxBody")}</P>
          <DocTable
            caption={t("docsRecordsSyntaxCaption")}
            head={[t("docsRecordsSyntaxConventionHead"), t("docsRecordsSyntaxResultHead")]}
            rows={[
              [<C key="a">||text||</C>, t("docsRecordsSyntaxRedaction")],
              [<C key="b">![right|caption](path)</C>, t("docsRecordsSyntaxFigure")],
              [<C key="c">&gt; quote</C>, t("docsRecordsSyntaxQuote")],
              [<C key="d">| table |</C>, t("docsRecordsSyntaxTable")],
            ]}
          />
          <P>{t("docsRecordsSyntaxBodyTwo")}</P>
          <P>{t("docsRecordsSyntaxBodyThree")}</P>
        </>
      );
    case "records:where":
      return (
        <>
          <P>{t("docsRecordsWhereBody")}</P>
          <P>{t("docsRecordsWhereBodyTwo")}</P>
          <DocCallout title={t("docsRecordsWhereCalloutTitle")}>
            <p>{t("docsRecordsWhereCalloutBody")}</p>
          </DocCallout>
        </>
      );

    /* -------------------------------------------------------------- rendering */
    case "rendering:pipeline":
      return (
        <>
          <P>{t("docsRenderingPipelineBody")}</P>
          <P>{t("docsRenderingPipelineBodyTwo")}</P>
          <DocCode t={t} label={t("docsRenderingPipelineLabel")} language="ts" code={PIPELINE_CODE} />
          <P>{t("docsRenderingPipelineBodyThree")}</P>
        </>
      );
    case "rendering:plugins":
      return (
        <>
          <DocTable
            caption={t("docsRenderingPluginsCaption")}
            head={[t("docsRenderingPluginsPluginHead"), t("docsRenderingPluginsDoesHead")]}
            rows={[
              [<C key="a">remark-frontmatter</C>, t("docsRenderingPluginFrontmatter")],
              [<C key="b">remark-gfm</C>, t("docsRenderingPluginGfm")],
              [<C key="c">normalise-redactions</C>, t("docsRenderingPluginNormalise")],
              [<C key="d">redaction-plugin</C>, t("docsRenderingPluginRedaction")],
              [<C key="e">image-directive-plugin</C>, t("docsRenderingPluginImage")],
              [<C key="f">heading-ids-plugin</C>, t("docsRenderingPluginHeadings")],
            ]}
          />
          <P>{t("docsRenderingPluginsBody")}</P>
        </>
      );
    case "rendering:warnings":
      return (
        <>
          <P>{t("docsRenderingWarningsBody")}</P>
          <ul className="meta-doc-list">
            <li>{t("docsRenderingWarningsOne")}</li>
            <li>{t("docsRenderingWarningsTwo")}</li>
            <li>{t("docsRenderingWarningsThree")}</li>
            <li>{t("docsRenderingWarningsFour")}</li>
          </ul>
          <P>{t("docsRenderingWarningsBodyTwo")}</P>
        </>
      );
    case "rendering:exports":
      return (
        <>
          <P>{t("docsRenderingExportsBody")}</P>
          <P>{t("docsRenderingExportsBodyTwo")}</P>
          <DocCallout tone="warning" title={t("docsRenderingExportsCalloutTitle")}>
            <p>{t("docsRenderingExportsCalloutBody")}</p>
          </DocCallout>
        </>
      );
    case "rendering:boundaries":
      return (
        <>
          <P>{t("docsRenderingBoundariesBody")}</P>
          <P>{t("docsRenderingBoundariesBodyTwo")}</P>
        </>
      );

    /* ----------------------------------------------------------------- routes */
    case "routes:map":
      return (
        <>
          <P>{t("docsRoutesMapBody")}</P>
          <DocTable
            caption={t("docsRoutesMapCaption")}
            head={[t("docsRoutesMapRouteHead"), t("docsRoutesMapRendersHead")]}
            rows={[
              [<C key="a">/[lang]</C>, t("docsRoutesMapPortal")],
              [<C key="b">/[lang]/site</C>, t("docsRoutesMapSite")],
              [<C key="c">/[lang]/site/records</C>, t("docsRoutesMapRecords")],
              [<C key="d">/[lang]/site/records/[code]</C>, t("docsRoutesMapRecord")],
              [<C key="e">/[lang]/site/records/[code]/download</C>, t("docsRoutesMapDownload")],
              [<C key="f">/[lang]/site/organizations</C>, t("docsRoutesMapOrganizations")],
              [<C key="g">/[lang]/site/random</C>, t("docsRoutesMapRandom")],
              [<C key="h">/[lang]/desktop</C>, t("docsRoutesMapDesktop")],
              [<C key="i">/[lang]/meta</C>, t("docsRoutesMapMeta")],
              [<C key="j">/[lang]/meta/about</C>, t("docsRoutesMapAbout")],
              [<C key="k">/[lang]/meta/documentation</C>, t("docsRoutesMapDocs")],
            ]}
          />
        </>
      );
    case "routes:language":
      return (
        <>
          <P>{t("docsRoutesLanguageBody")}</P>
          <P>{t("docsRoutesLanguageBodyTwo")}</P>
          <DocCallout title={t("docsRoutesLanguageCalloutTitle")}>
            <p>{t("docsRoutesLanguageCalloutBody")}</p>
          </DocCallout>
        </>
      );
    case "routes:editions":
      return (
        <>
          <P>{t("docsRoutesEditionsBody")}</P>
          <P>{t("docsRoutesEditionsBodyTwo")}</P>
        </>
      );
    case "routes:adding":
      return (
        <>
          <P>{t("docsRoutesAddingBody")}</P>
          <DocCode t={t} label={t("docsRoutesAddingLabel")} language="tsx" code={ROUTE_CODE} />
          <P>{t("docsRoutesAddingBodyTwo")}</P>
        </>
      );

    /* ----------------------------------------------------------- contributing */
    case "contributing:before":
      return (
        <>
          <P>{t("docsContributingBeforeBody")}</P>
          <DocCallout tone="warning" title={t("docsContributingBeforeCalloutTitle")}>
            <p>{t("docsContributingBeforeCalloutBody")}</p>
          </DocCallout>
        </>
      );
    case "contributing:branch":
      return (
        <>
          <P>{t("docsContributingBranchBody")}</P>
          <ul className="meta-doc-list">
            <li>{t("docsContributingBranchOne")}</li>
            <li>{t("docsContributingBranchTwo")}</li>
            <li>{t("docsContributingBranchThree")}</li>
          </ul>
          <P>{t("docsContributingBranchBodyTwo")}</P>
        </>
      );
    case "contributing:checks":
      return (
        <>
          <P>{t("docsContributingChecksBody")}</P>
          <DocCode
            t={t}
            label={t("docsContributingChecksLabel")}
            language="sh"
            code={`bun run check
bun run test
bun run check:client
bun run precommit`}
          />
          <P>{t("docsContributingChecksBodyTwo")}</P>
        </>
      );
    case "contributing:docs":
      return (
        <>
          <P>{t("docsContributingDocsBody")}</P>
          <ul className="meta-doc-list">
            <li>{t("docsContributingDocsOne")}</li>
            <li>{t("docsContributingDocsTwo")}</li>
            <li>{t("docsContributingDocsThree")}</li>
            <li>{t("docsContributingDocsFour")}</li>
          </ul>
        </>
      );
    case "contributing:pull":
      return (
        <>
          <P>{t("docsContributingPullBody")}</P>
          <P>{t("docsContributingPullBodyTwo")}</P>
          <DocCallout title={t("docsContributingPullCalloutTitle")}>
            <p>{t("docsContributingPullCalloutBody")}</p>
          </DocCallout>
        </>
      );

    /* ---------------------------------------------------------------- testing */
    case "testing:rhythm":
      return (
        <>
          <P>{t("docsTestingRhythmBody")}</P>
          <P>{t("docsTestingRhythmBodyTwo")}</P>
        </>
      );
    case "testing:unit":
      return (
        <>
          <P>{t("docsTestingUnitBody")}</P>
          <DocTable
            caption={t("docsTestingUnitCaption")}
            head={[t("docsTestingUnitFileHead"), t("docsTestingUnitHoldsHead")]}
            rows={[
              [<C key="a">markdown-pipeline.test.ts</C>, t("docsTestingUnitPipeline")],
              [<C key="b">archive-site.test.tsx</C>, t("docsTestingUnitArchive")],
              [<C key="c">i18n-messages.test.ts</C>, t("docsTestingUnitCatalog")],
              [<C key="d">desktop.test.tsx</C>, t("docsTestingUnitDesktop")],
              [<C key="e">window-manager.test.tsx</C>, t("docsTestingUnitWindows")],
            ]}
          />
          <P>{t("docsTestingUnitBodyTwo")}</P>
        </>
      );
    case "testing:catalog":
      return (
        <>
          <P>{t("docsTestingCatalogBody")}</P>
          <P>{t("docsTestingCatalogBodyTwo")}</P>
        </>
      );
    case "testing:e2e":
      return (
        <>
          <P>{t("docsTestingE2eBody")}</P>
          <DocCode
            t={t}
            label={t("docsTestingE2eLabel")}
            language="sh"
            code={`bunx playwright install chromium
bun run test:e2e`}
          />
          <P>{t("docsTestingE2eBodyTwo")}</P>
        </>
      );
    case "testing:coverage":
      return (
        <>
          <P>{t("docsTestingCoverageBody")}</P>
          <P>{t("docsTestingCoverageBodyTwo")}</P>
        </>
      );

    /* ----------------------------------------------------------------- design */
    case "design:systems":
      return (
        <>
          <P>{t("docsDesignSystemsBody")}</P>
          <DocTable
            caption={t("docsDesignSystemsCaption")}
            head={[
              t("docsDesignSystemsSystemHead"),
              t("docsDesignSystemsSurfaceHead"),
              t("docsDesignSystemsRuleHead"),
            ]}
            rows={[
              [t("docsDesignSystemsWorkstation"), <C key="a">/desktop</C>, t("docsDesignSystemsWorkstationRule")],
              [t("docsDesignSystemsReading"), <C key="b">/site</C>, t("docsDesignSystemsReadingRule")],
              [t("docsDesignSystemsProject"), <C key="c">/meta</C>, t("docsDesignSystemsProjectRule")],
            ]}
          />
          <DocCallout title={t("docsDesignSystemsCalloutTitle")}>
            <p>{t("docsDesignSystemsCalloutBody")}</p>
          </DocCallout>
        </>
      );
    case "design:tokens":
      return (
        <>
          <P>{t("docsDesignTokensBody")}</P>
          <DocTable
            caption={t("docsDesignTokensCaption")}
            head={[t("docsDesignTokensTokenHead"), t("docsDesignTokensUseHead")]}
            rows={[
              [<C key="a">--meta-ink</C>, t("docsDesignTokensInk")],
              [<C key="b">--meta-bone</C>, t("docsDesignTokensBone")],
              [<C key="c">--meta-mist</C>, t("docsDesignTokensMist")],
              [<C key="d">--meta-ember</C>, t("docsDesignTokensEmber")],
              [<C key="e">--meta-line</C>, t("docsDesignTokensLine")],
              [<C key="f">--meta-serif</C>, t("docsDesignTokensSerif")],
              [<C key="g">--meta-sans</C>, t("docsDesignTokensSans")],
              [<C key="h">--meta-mono</C>, t("docsDesignTokensMono")],
            ]}
          />
          <P>{t("docsDesignTokensBodyTwo")}</P>
        </>
      );
    case "design:patterns":
      return (
        <>
          <P>{t("docsDesignPatternsBody")}</P>
          <ul className="meta-doc-list">
            <li>{t("docsDesignPatternsOne")}</li>
            <li>{t("docsDesignPatternsTwo")}</li>
            <li>{t("docsDesignPatternsThree")}</li>
            <li>{t("docsDesignPatternsFour")}</li>
          </ul>
          <P>{t("docsDesignPatternsBodyTwo")}</P>
        </>
      );
    case "design:access":
      return (
        <>
          <P>{t("docsDesignAccessBody")}</P>
          <ul className="meta-doc-list">
            <li>{t("docsDesignAccessOne")}</li>
            <li>{t("docsDesignAccessTwo")}</li>
            <li>{t("docsDesignAccessThree")}</li>
            <li>{t("docsDesignAccessFour")}</li>
            <li>{t("docsDesignAccessFive")}</li>
          </ul>
          <P>{t("docsDesignAccessBodyTwo")}</P>
        </>
      );
    case "design:adding":
      return (
        <>
          <P>{t("docsDesignAddingBody")}</P>
          <P>{t("docsDesignAddingBodyTwo")}</P>
        </>
      );

    default:
      return null;
  }
}

export function DocsBody({ topic }: Readonly<{ topic: DocTopic }>) {
  const t = useTranslations("meta");

  return (
    <>
      {topic.sections.map((section) => {
        const title = t(section.titleKey);
        return (
          <section className="meta-doc-section" id={section.id} key={section.id} aria-labelledby={`${section.id}-title`}>
            <h2 id={`${section.id}-title`}>
              {title}
              <a className="meta-doc-anchor" href={`#${section.id}`} aria-label={t("docsAnchor")}>
                #
              </a>
            </h2>
            {sectionBody(topic.slug, section.id, t)}
          </section>
        );
      })}
    </>
  );
}
