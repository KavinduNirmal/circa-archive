import { documentationHeadings } from "@/components/meta/docs/docs-markdown";
import { readFileSync } from "node:fs";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createTranslator } from "next-intl";
import { MetaChrome } from "@/components/meta/meta-chrome";
import { ARCHIVE_INDEX } from "@/components/browser/archive-index";
import { DocsPage } from "@/components/meta/docs/docs-page";
import {
  DOC_GROUPS,
  DOC_TOPICS,
  docHref,
  docNeighbours,
  docTopic,
} from "@/components/meta/docs/docs-topics";
import { MetaHome } from "@/components/meta/meta-home";
import {
  MetaNav,
  type MetaNavGroup,
  type MetaNavLabels,
} from "@/components/meta/meta-nav";
import { PROJECT_LINKS } from "@/components/meta/meta-links";
import { catalogFor, renderWithIntl } from "./intl";

/**
 * The project layer as a reader meets it: the landing report, the navigation,
 * and the documentation. Copy is read from the shipped catalogs, so these tests
 * assert the sentences and destinations a person gets, not the keys that built
 * them.
 */

vi.mock("next-intl/server", () => ({
  getTranslations: async ({
    locale,
    namespace,
  }: {
    locale: "en" | "ko";
    namespace: "meta";
  }) => createTranslator({ locale, namespace, messages: catalogFor(locale) }),
}));

const english = catalogFor("en");
const korean = catalogFor("ko");
const meta = english.meta;

const navLabels: MetaNavLabels = {
  search: meta.docsSearchLabel,
  brand: meta.brand,
  brandTail: "Archive",
  menu: meta.navMenu,
  menuLabel: meta.navMenuLabel,
  close: meta.navClose,
  home: meta.navHome,
  docs: meta.navDocs,
  about: meta.navAbout,
  archive: meta.navArchiveLink,
  workstation: meta.navWorkstation,
  archiveCta: meta.navOpenArchive,
  sourceCta: meta.navSource,
  skip: meta.skip,
};

const navGroups: MetaNavGroup[] = DOC_GROUPS.map((group) => ({
  label: meta[group.labelKey],
  items: group.slugs.map((slug) => {
    const topic = docTopic(slug)!;
    return { label: meta[topic.navKey], href: docHref(slug) };
  }),
}));

describe("the project landing page", () => {
  it("opens on the report title and the three doors", () => {
    renderWithIntl(<MetaHome />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      `${meta.heroTitleA} ${meta.heroTitleB}`,
    );
    expect(
      screen.getAllByRole("link", { name: new RegExp(meta.heroPrimary) })[0],
    ).toHaveAttribute("href", "/en/meta/documentation");
    expect(
      screen.getByRole("link", { name: new RegExp(meta.heroSecondary) }),
    ).toHaveAttribute("href", "/en/site");

    const source = screen.getByRole("link", {
      name: new RegExp(meta.heroSource),
    });
    expect(source).toHaveAttribute("target", "_blank");
    expect(source.getAttribute("rel")).toContain("noreferrer");
  });

  it("counts the corpus instead of claiming a number", () => {
    renderWithIntl(<MetaHome />);

    const stats = screen.getAllByRole("definition")[0].closest("dl")!;
    expect(
      within(stats).getByText(String(ARCHIVE_INDEX.length).padStart(2, "0")),
    ).toBeVisible();
    expect(within(stats).getByText(meta.statLanguagesValue)).toBeVisible();
    expect(within(stats).queryByText("Backend")).toBeNull();
  });

  it("introduces the documentation pillars and links to the full index", () => {
    renderWithIntl(<MetaHome />);

    expect(
      screen.getByRole("heading", { name: meta.docsPillarArchTitle }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: meta.docsPillarAuthorTitle }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: meta.docsPillarLoreTitle }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: new RegExp(meta.docsAllLink) }),
    ).toHaveAttribute("href", "/en/meta/documentation");
  });

  it("shows one record as evidence and links to the full filing", () => {
    renderWithIntl(<MetaHome />);

    expect(screen.getByText(meta.specimenCode)).toBeVisible();
    expect(
      screen.getByRole("link", { name: new RegExp(meta.specimenLink) }),
    ).toHaveAttribute("href", `/en/site/records/${meta.specimenCode}`);
  });

  it("ends on the questions, with the repository one link away", () => {
    renderWithIntl(<MetaHome />);

    const sections = screen.getAllByRole("heading", { level: 2 });
    expect(sections.at(-1)).toHaveTextContent(meta.faqTitle);
    expect(
      screen.getByRole("link", { name: new RegExp(meta.contributeRepository) }),
    ).toHaveAttribute("href", PROJECT_LINKS.repository);
  });
});

describe("the project navigation", () => {
  it("offers the docs, the dossier, the workstation, and the archive", () => {
    renderWithIntl(
      <MetaNav
        labels={navLabels}
        groups={navGroups}
        repositoryUrl="https://github.com/example"
      />,
    );

    expect(
      screen.getByRole("button", { name: new RegExp(meta.navDocs) }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: new RegExp(meta.navHome) }),
    ).toHaveAttribute("href", "/en/meta");
    expect(
      screen.getByRole("link", { name: new RegExp(meta.navAbout) }),
    ).toHaveAttribute("href", "/en/meta/about");
    expect(
      screen.getByRole("link", { name: new RegExp(meta.navWorkstation) }),
    ).toHaveAttribute("href", "/en/desktop");
    expect(
      screen.getByRole("link", { name: new RegExp(meta.navOpenArchive) }),
    ).toHaveAttribute("href", "/en/site");
  });

  it("offers documentation search and keeps mobile topics grouped", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <MetaNav
        labels={navLabels}
        groups={navGroups}
        repositoryUrl="https://github.com/example"
      />,
    );
    expect(
      screen.getByRole("link", { name: /Search all documentation/ }),
    ).toHaveAttribute("href", "/en/meta/documentation#documentation-search");
    await user.click(screen.getByRole("button", { name: meta.navMenu }));
    const drawer = screen.getByRole("dialog");
    for (const group of navGroups)
      expect(within(drawer).getByText(group.label)).toBeVisible();
  });

  it("opens the documentation panel with its grouped topics", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <MetaNav
        labels={navLabels}
        groups={navGroups}
        repositoryUrl="https://github.com/example"
      />,
    );

    await user.click(
      screen.getByRole("button", { name: new RegExp(meta.navDocs) }),
    );

    const overview = await screen.findByRole("link", {
      name: meta.docsOverviewNav,
    });
    expect(overview).toHaveAttribute("href", "/en/meta/documentation");

    // Primary groups are displayed
    expect(screen.getByText(navGroups[0].label)).toBeVisible();
    expect(screen.getByText(navGroups[1].label)).toBeVisible();
    expect(screen.getByText(navGroups[2].label)).toBeVisible();

    // Secondary codices (Author guide & Lore) are shown as featured entry cards
    expect(
      screen.getByRole("link", { name: new RegExp(navGroups[3].label) }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: new RegExp(navGroups[4].label) }),
    ).toBeVisible();

    // Detailed lore items are stripped from the dropdown to keep it uncluttered
    expect(
      screen.queryByRole("link", { name: meta.docsLoreAnatomyNav }),
    ).not.toBeInTheDocument();
  });
});

describe("the documentation", () => {
  const records = docTopic("records")!;
  const docLocalPath = (topic: (typeof DOC_TOPICS)[number], locale: string) =>
    topic.sourceFile
      ? `../${topic.sourceFile}`
      : `../docs/documentation/${locale}/${topic.slug}.md`;
  const documents = (locale = "en") =>
    DOC_TOPICS.map((topic) => ({
      slug: topic.slug,
      markdown: readFileSync(docLocalPath(topic, locale), "utf8"),
    }));

  it("renders the topic, its sections, and its sidebar order", () => {
    renderWithIntl(
      <DocsPage topic={records} documents={documents()} locale="en" />,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      meta.docsRecordsTitle,
    );
    for (const section of documentationHeadings(
      documents().find((entry) => entry.slug === "records")!.markdown,
    )) {
      expect(
        screen.getByRole("heading", { level: 2, name: section.title }),
      ).toBeVisible();
    }

    for (const topic of DOC_TOPICS) {
      expect(
        screen.getAllByRole("link", { name: new RegExp(meta[topic.navKey]) })
          .length,
      ).toBeGreaterThan(0);
    }
  });

  it("filters the sidebar without leaving the page", async () => {
    const user = userEvent.setup();
    const { container } = renderWithIntl(
      <DocsPage topic={records} documents={documents()} locale="en" />,
    );

    const desktop = container.querySelector(
      ".meta-docs-sidebar-inner",
    ) as HTMLElement;
    const input = within(desktop).getByRole("searchbox");
    await user.type(input, "Rendering pipeline");

    expect(
      within(desktop).queryByRole("link", { name: /Writing a record/ }),
    ).toBeNull();
    expect(
      within(desktop).getByRole("link", { name: /Rendering pipeline/ }),
    ).toBeVisible();

    await user.clear(input);
    await user.type(input, "no such topic");
    expect(within(desktop).getByText(meta.docsSearchEmpty)).toBeVisible();
  });

  it("moves to the previous and next topic in reading order", () => {
    const { previous, next } = docNeighbours("records");
    renderWithIntl(
      <DocsPage topic={records} documents={documents()} locale="en" />,
    );

    expect(
      screen.getByRole("link", { name: new RegExp(meta.docsPrevious) }),
    ).toHaveAttribute("href", `/en${docHref(previous!.slug)}`);
    expect(
      screen.getByRole("link", { name: new RegExp(meta.docsNext) }),
    ).toHaveAttribute("href", `/en${docHref(next!.slug)}`);
  });

  it("labels the copy key and the on-page contents", () => {
    renderWithIntl(
      <DocsPage topic={records} documents={documents()} locale="en" />,
    );

    expect(
      screen.getAllByRole("button", { name: new RegExp(meta.docsCopy) }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("navigation", { name: meta.docsOnThisPage }),
    ).toBeVisible();
  });

  it("answers in Korean with translated section headings", () => {
    renderWithIntl(
      <DocsPage topic={records} documents={documents("ko")} locale="ko" />,
      { locale: "ko" },
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      korean.meta.docsRecordsTitle,
    );
    for (const section of documentationHeadings(
      documents("ko").find((entry) => entry.slug === "records")!.markdown,
    )) {
      expect(
        screen.getByRole("heading", { level: 2, name: section.title }),
      ).toBeVisible();
    }
  });
});

describe("the documentation index", () => {
  it("groups every topic once and keeps the short overview address", () => {
    const grouped = DOC_GROUPS.flatMap((group) => [...group.slugs]);
    expect(new Set(grouped).size).toBe(DOC_TOPICS.length);
    expect(grouped.sort()).toEqual(
      DOC_TOPICS.map((topic) => topic.slug).sort(),
    );
    expect(docHref("overview")).toBe("/meta/documentation");
    expect(docHref("records")).toBe("/meta/documentation/records");
  });

  it("has a title, a lede, and sections for every topic", () => {
    for (const topic of DOC_TOPICS) {
      expect(meta[topic.titleKey]).toBeTruthy();
      expect(meta[topic.ledeKey]).toBeTruthy();
      if (!topic.sourceFile) {
        for (const locale of ["en", "ko"]) {
          const markdown = readFileSync(
            `../docs/documentation/${locale}/${topic.slug}.md`,
            "utf8",
          );
          expect(documentationHeadings(markdown).length).toBeGreaterThanOrEqual(
            3,
          );
        }
      } else {
        const markdown = readFileSync(`../${topic.sourceFile}`, "utf8");
        expect(documentationHeadings(markdown).length).toBeGreaterThanOrEqual(
          1,
        );
      }
    }
  });
});

describe("the shared project frame", () => {
  it.each(["en", "ko"] as const)(
    "keeps navigation without a backend status banner in %s",
    async (locale) => {
      const { container } = renderWithIntl(
        await MetaChrome({ lang: locale, children: <h1>Project</h1> }),
        { locale },
      );
      const copy = catalogFor(locale).meta;
      expect(container.querySelector(".meta-topline-right")).toBeNull();
      expect(screen.getByRole("heading", { name: "Project" })).toBeVisible();
      expect(
        screen.getByRole("link", { name: new RegExp(copy.navHome) }),
      ).toHaveAttribute("href", `/${locale}/meta`);
    },
  );
});
