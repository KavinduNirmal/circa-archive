import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ArchiveHome } from "@/components/archive-site/archive-home";
import { ArchiveAbout } from "@/components/archive-site/archive-about";
import { ArchiveExplorations } from "@/components/archive-site/archive-explorations";
import { ArchiveOrganizations } from "@/components/archive-site/archive-organizations";
import { ArchiveRecord } from "@/components/archive-site/archive-record";
import { ArchiveRecords } from "@/components/archive-site/archive-records";
import { parseSearchState } from "@/lib/search/query";
import { searchFixture } from "@/lib/search/fixture";
import { MetaAbout } from "@/components/meta/meta-about";
import { ISSUES, LICENCES, PROJECT_LINKS } from "@/components/meta/meta-links";
import { RecordProse } from "@/components/archive-site/record-prose";
import {
  mostConsulted,
  randomRecordCode,
} from "@/components/archive-site/archive-data";
import {
  ARCHIVE_INDEX,
  recentFilings,
} from "@/components/browser/archive-index";
import { GET as downloadRecord } from "@/app/[lang]/site/records/[code]/download/route";
import { catalogFor, renderWithIntl, translatorFor } from "./intl";

/**
 * The public archive, as a plain website.
 *
 * These tests read the page components rather than the route files: the routes
 * only resolve a language, a code, and metadata, while everything a reader sees
 * is assembled here. The copy is the shipped catalog, so a test asserts the
 * sentence a reader sees rather than the key that produced it.
 */

vi.mock("@/components/auth/session-access-link", async () => {
  const { AccessLink } = await import("@/components/auth/access-link");
  return {
    SessionAccessLink: (props: {
      variant?: "archive" | "portal";
      className?: string;
    }) => <AccessLink {...props} state={{ status: "guest" }} />,
  };
});

const english = catalogFor("en");
const korean = catalogFor("ko");
const site = english.site;
const siteT = translatorFor("site");

const entryFor = (code: string) =>
  ARCHIVE_INDEX.find((entry) => entry.code === code)!;

describe("the archive home", () => {
  it("opens archive and site dropdowns on hover and dismisses with Escape", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ArchiveHome />);
    const nav = screen.getByRole("navigation", { name: site.navLabel });
    const archive = within(nav).getByRole("button", { name: site.navAbout });
    expect(archive).toHaveAttribute("aria-expanded", "false");
    await user.hover(archive);
    expect(archive).toHaveAttribute("aria-expanded", "true");
    expect(within(nav).getByRole("link", { name: "Rules" })).toHaveAttribute(
      "href",
      "/en/meta/documentation/author-guide#conduct-assessment-and-appeals",
    );
    expect(
      within(nav).getByRole("link", { name: "Content Warnings" }),
    ).toHaveAttribute(
      "href",
      "/en/meta/documentation/author-guide#content-warnings-and-access",
    );
    expect(within(nav).getByRole("link", { name: "Guidelines" })).toBeVisible();
    expect(within(nav).getByRole("link", { name: "Filings" })).toHaveAttribute(
      "href",
      "/en/site/records",
    );
    await user.unhover(archive);
    expect(archive).toHaveAttribute("aria-expanded", "false");
    archive.focus();
    await user.keyboard("{Enter}{Tab}");
    expect(within(nav).getByRole("link", { name: "Rules" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(archive).toHaveFocus();
    expect(archive).toHaveAttribute("aria-expanded", "false");
    const project = within(nav).getByRole("button", { name: site.aboutSite });
    await user.click(project);
    for (const name of ["Sponsor", "Github", "Documentation", "Lore", "TOS"]) {
      expect(within(nav).getByRole("link", { name })).toBeVisible();
    }
    await user.click(screen.getByRole("heading", { level: 1 }));
    expect(project).toHaveAttribute("aria-expanded", "false");
  });

  it("offers the index, the organizations, and the workstation as ordinary links", () => {
    renderWithIntl(<ArchiveHome />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      site.homeTitle,
    );

    const nav = screen.getByRole("navigation", { name: site.navLabel });
    for (const [name, href] of [
      [site.navArchive, "/en/site"],
      [site.navRecords, "/en/site/records"],
      [site.navOrganizations, "/en/site/organizations"],
      [site.navAbout, "/en/site/about"],
      [site.actionRandom, "/en/site/random"],
      [site.navWorkstation, "/en/desktop"],
    ] as const) {
      expect(within(nav).getByRole("link", { name })).toHaveAttribute(
        "href",
        href,
      );
    }
    expect(
      within(nav).getByRole("link", { name: site.navAbout }).parentElement
        ?.nextElementSibling,
    ).toHaveTextContent(site.aboutSite);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/en/sign-in",
    );
    // The project page remains reachable from the section bar.
    expect(
      screen.getAllByRole("link", { name: site.aboutSite })[0],
    ).toHaveAttribute("href", "/en/meta");
  });

  it("puts the search in the masthead and again in the page, as a plain form", () => {
    renderWithIntl(<ArchiveHome />);
    const searches = screen.getAllByRole("search");
    expect(searches).toHaveLength(2);
    for (const form of searches) {
      expect(form).toHaveAttribute("action", "/en/site/records");
      expect(form).toHaveAttribute("method", "get");
      expect(
        within(form).getByRole("searchbox", { name: site.searchLabel }),
      ).toHaveAttribute("name", "q");
    }
  });

  it("gives both searches the global facets and filed range", async () => {
    renderWithIntl(<ArchiveHome />);
    const [masthead, page] = screen.getAllByRole("search");
    for (const form of [masthead, page]) {
      expect(
        within(form).getByRole("group", { name: site.searchClass }),
      ).toBeInTheDocument();
      expect(
        within(form).getByRole("group", { name: site.searchStatus }),
      ).toBeInTheDocument();
      expect(
        within(form).getByRole("group", { name: site.searchType }),
      ).toBeInTheDocument();
      expect(within(form).getByLabelText(site.filterFiled)).toHaveAttribute(
        "name",
        "period",
      );
      expect(
        within(form).getByLabelText(new RegExp(site.searchHolderCode)),
      ).toHaveAttribute("name", "holder");
      expect(within(form).getByLabelText(site.searchLanguage)).toHaveAttribute(
        "name",
        "language",
      );
    }
    for (const form of [masthead, page]) {
      expect(form.querySelector("details")?.open).toBe(false);
      await userEvent.click(
        within(form).getByText(site.filtersLabel, { selector: "summary" }),
      );
      expect(
        within(form).getByRole("button", { name: site.applyFilters }),
      ).toBeVisible();
    }
    // The masthead's filters live behind a disclosure, so their key is only
    // reachable once the strip is opened — the markup is there, the a11y tree
    // hides it until then.
    expect(
      within(masthead).getByRole("button", {
        name: site.applyFilters,
        hidden: true,
      }),
    ).toBeInTheDocument();
    expect(
      within(page).getByText(site.filtersLabel, { selector: "summary" }),
    ).toBeVisible();
  });

  it("opens with the classification notice above the masthead", () => {
    renderWithIntl(<ArchiveHome />);
    expect(screen.getByText(site.classifiedLead)).toBeVisible();
    expect(screen.getByText(site.classifiedMark)).toBeVisible();
    expect(screen.getByText(site.classifiedFoot)).toBeVisible();
  });

  it("runs the announcement, its pause box, and its key, and offers the featured, popular, and random doors", () => {
    renderWithIntl(<ArchiveHome />);
    expect(screen.getByText(site.bannerLabel)).toBeVisible();
    // The ticker carries two copies of the line so its loop has no seam; the
    // second is decoration and is hidden from the accessibility tree.
    const [firstCopy] = screen.getAllByText(site.bannerText);
    expect(firstCopy).toBeVisible();
    expect(
      screen.getByRole("checkbox", { name: site.bannerPause }),
    ).not.toBeChecked();
    expect(screen.getByRole("link", { name: site.bannerLink })).toHaveAttribute(
      "href",
      "/en/site/about",
    );
    expect(
      screen.getByRole("heading", { name: site.featuredTitle }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: site.popularTitle }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: site.randomTitle }),
    ).toBeVisible();
    for (const { entry } of mostConsulted(3)) {
      expect(
        screen.getAllByText(entry.designation ?? entry.code).length,
      ).toBeGreaterThan(0);
    }
    expect(
      screen.getAllByRole("link", { name: new RegExp(site.randomLink) })[0],
    ).toHaveAttribute("href", "/en/site/random");
  });

  it("shows what was most recently filed and how much the index holds", () => {
    renderWithIntl(<ArchiveHome />);
    for (const entry of recentFilings(ARCHIVE_INDEX, 5)) {
      expect(
        screen.getAllByText(new RegExp(entry.code)).length,
      ).toBeGreaterThan(0);
    }
    expect(
      screen.getByRole("link", { name: site.homeIndexLink }),
    ).toHaveAttribute("href", "/en/site/records");
    expect(
      screen.getAllByText(
        site.homeCount.replace("{count}", String(ARCHIVE_INDEX.length)),
      ).length,
    ).toBeGreaterThan(0);
  });
});

describe("the index of records", () => {
  it("lists every released entry and opens each on its own page", () => {
    renderWithIntl(<ArchiveRecords />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      site.indexTitle,
    );

    for (const entry of ARCHIVE_INDEX) {
      const name = site.openRecord.replace("{code}", entry.code);
      expect(
        screen.getAllByRole("link", { name }).length,
        entry.code,
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByRole("link", { name })[0],
        entry.code,
      ).toHaveAttribute("href", `/en/site/records/${entry.code}`);
    }

    // Two entries have no released designation, and both say so rather than printing a blank cell.
    expect(screen.getAllByText(site.withheldDesignation)).toHaveLength(2);
  });

  it("prints the archive's own class and status words", () => {
    renderWithIntl(<ArchiveRecords />);
    expect(screen.getAllByText(site.classIncident).length).toBeGreaterThan(0);
    expect(screen.getAllByText(site.statusSealed).length).toBeGreaterThan(0);
    expect(screen.getAllByText(site.statusErased).length).toBeGreaterThan(0);
  });
  it("marks warning status with a swatch and label that name the warnings on hover", () => {
    renderWithIntl(<ArchiveRecords />);
    expect(
      screen.getByRole("columnheader", { name: site.columnWarnings }),
    ).toBeVisible();

    const rowFor = (code: string) =>
      screen
        .getAllByRole("link", {
          name: site.openRecord.replace("{code}", code),
        })[0]
        .closest("tr")!;

    const present = within(rowFor("INC-00042")).getByRole("img");
    expect(present).toHaveAttribute("data-warning", "present");
    expect(
      within(rowFor("INC-00042")).getByText(site.warningWarning),
    ).toBeVisible();
    expect(present).toHaveAttribute(
      "title",
      `${site.warningWarning} — ${site.warningPresent}: ${site.warningTagPsychological}`,
    );

    const author = within(rowFor("INC-00204")).getByRole("img");
    expect(author).toHaveAttribute("data-warning", "author");
    expect(author).toHaveAttribute(
      "title",
      `${site.warningWarning} — ${site.warningAuthor}: ${site.warningTagDeath}`,
    );

    const none = within(rowFor("INC-00014")).getByRole("img");
    expect(none).toHaveAttribute("data-warning", "none");
    expect(
      within(rowFor("INC-00014")).getByText(site.warningClear),
    ).toBeVisible();
    expect(none).toHaveAttribute(
      "title",
      `${site.warningClear} — ${site.warningNone}`,
    );
  });
});

describe("a released record", () => {
  it("renders its filed prose, its sections, and the records filed against it", () => {
    const entry = entryFor("INC-00014");
    renderWithIntl(<ArchiveRecord code={entry.code} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      entry.designation!,
    );
    expect(screen.getAllByText(site.recordLabel).length).toBeGreaterThan(0);
    expect(screen.getAllByText(entry.code).length).toBeGreaterThan(0);

    // Section headings come from the filing, not from a constant.
    expect(
      screen.getByRole("heading", { name: "Brief", level: 2 }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "The waybill", level: 2 }),
    ).toBeVisible();
    expect(
      screen.getByText(/The discrepancy is in the number of vehicles/),
    ).toBeVisible();
    expect(
      screen.getByText(/The train was complete at both ends/),
    ).toBeVisible();

    // The two directions of the citation web stay apart.
    expect(screen.getByText(site.recordInbound)).toBeVisible();
    expect(screen.getByText(site.recordOutbound)).toBeVisible();
    expect(screen.getByRole("link", { name: /INC-00042/ })).toHaveAttribute(
      "href",
      "/en/site/records/INC-00042",
    );
    expect(screen.getByRole("link", { name: /INC-00063/ })).toHaveAttribute(
      "href",
      "/en/site/records/INC-00063",
    );
  });

  it("holds a sealed section at the desk and never prints its prose", () => {
    renderWithIntl(<ArchiveRecord code="INC-00042" />);
    expect(
      screen.getByRole("heading", { name: "Disposition", level: 2 }),
    ).toBeVisible();
    expect(screen.getByText(/Sealed at Level 5 on 2001-03-04/)).toBeVisible();
  });

  it("releases only the index entry for a filing that is held", () => {
    renderWithIntl(<ArchiveRecord code="INC-00118" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      site.withheldDesignation,
    );
    expect(screen.getByText(site.recordHeldTitle)).toBeVisible();
    expect(screen.getByText(site.recordHeldBody)).toBeVisible();
    expect(
      screen.getByText(/The designation is withheld at Level 5/),
    ).toBeVisible();
  });

  it("renders the corpus's tables, figures, and redactions as plain HTML", () => {
    renderWithIntl(<ArchiveRecord code="CIRCA-S-03007" />);
    const tables = screen.getAllByRole("table");
    expect(tables).toHaveLength(3);
    expect(screen.getByText(/Figure 1\. The door, photographed/)).toBeVisible();
    expect(screen.getAllByText(site.recordRedaction).length).toBeGreaterThan(0);

    // The filing's own footer is a register, and its citations stay inside the
    // reader's language instead of falling back to the unprefixed route.
    const crossReference = tables[2];
    expect(within(crossReference).getByText("Related records")).toBeVisible();
    expect(
      within(crossReference).getByRole("link", { name: "INC-00907" }),
    ).toHaveAttribute("href", "/en/site/records/INC-00907");
  });

  it("gives every section an anchor and a contents list that reaches it", () => {
    const { container } = renderWithIntl(<ArchiveRecord code="INC-00014" />);
    const contents = screen.getByRole("navigation", {
      name: site.recordContents,
    });
    const links = within(contents).getAllByRole("link");
    expect(links.length).toBeGreaterThan(1);
    for (const link of links) {
      const href = link.getAttribute("href")!;
      const section = container.querySelector(href);
      expect(section, href).not.toBeNull();
      const heading = section!.querySelector("h2")!;
      expect(heading.textContent?.trim()).not.toMatch(/^\d/);
      expect(link.textContent?.trim()).toBe(heading.textContent?.trim());
    }
  });

  it("keeps a record's status updates in their own collapsed sidebar section", () => {
    renderWithIntl(<ArchiveRecord code="CIRCA-S-03007" />);
    const summary = screen.getByText("3 updates", { selector: "summary" });
    const disclosure = summary.closest("details");
    expect(disclosure).not.toBeNull();
    expect(disclosure).not.toHaveAttribute("open");
    // The history is its own rail section, not a row squeezed into the particulars.
    expect(disclosure!.closest("dl")).toBeNull();
    const section = disclosure!.closest("section");
    expect(section).not.toBeNull();
    expect(
      within(section!).getByRole("heading", { name: site.recordUpdates }),
    ).toBeVisible();
    expect(
      within(disclosure!).getByText(
        "The severity has been changed from A to S.",
      ),
    ).toBeInTheDocument();
    expect(
      within(disclosure!).getByText(
        "[Daydream Inc.] has claimed this record was erased.",
      ),
    ).toBeInTheDocument();
    // Every card carries the tone its sentence reports, so the rail can colour it.
    expect(
      [...disclosure!.querySelectorAll("li[data-tone]")].map((card) =>
        card.getAttribute("data-tone"),
      ),
    ).toEqual(["changed", "claimed", "neutral"]);
    // The history exists once, in the aside, and never as a second copy in the sheet.
    expect(
      screen.getAllByText("The severity has been changed from A to S."),
    ).toHaveLength(1);
  });

  it("links a record's exploration count to its exploration list", () => {
    renderWithIntl(<ArchiveRecord code="INC-00027" />);
    const link = screen.getByRole("link", {
      name: "Open the explorations of INC-00027",
    });
    expect(link).toHaveAttribute(
      "href",
      "/en/site/records/INC-00027/explorations",
    );
    expect(link).toHaveTextContent("1 exploration");
  });
});

describe("the explorations list", () => {
  it("lists the exploration records filed against a record", () => {
    renderWithIntl(<ArchiveExplorations code="INC-00027" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Explorations of Signal repeat interval, eleven hours",
    );
    const table = screen.getByRole("region", {
      name: "Explorations filed against INC-00027",
    });
    expect(
      within(table).getByRole("link", { name: "Open INC-00907" }),
    ).toHaveAttribute("href", "/en/site/records/INC-00907");
    expect(
      screen.getByRole("link", { name: "Return to INC-00027" }),
    ).toHaveAttribute("href", "/en/site/records/INC-00027");
  });
});

describe("the archive's directories", () => {
  it("lists every organization with the filings it holds", () => {
    renderWithIntl(<ArchiveOrganizations />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      site.orgTitle,
    );

    const organizations = ARCHIVE_INDEX.filter(
      (entry) => entry.klass === "organization",
    );
    for (const organization of organizations) {
      const holdings = ARCHIVE_INDEX.filter(
        (entry) => entry.organization === organization.code,
      ).length;
      const entry = screen.getByText(organization.code).closest("li")!;
      // The holdings are a tally in the margin: the figure and its label, not a sentence.
      expect(
        within(entry).getByText(String(holdings).padStart(2, "0")),
      ).toBeVisible();
      expect(within(entry).getByText(site.ledgerFilings)).toBeVisible();
      expect(
        within(entry).getByRole("link", { name: site.orgOpen }),
      ).toHaveAttribute("href", `/en/site/records/${organization.code}`);
    }
  });

  it("searches the directory and keeps the query in the address", () => {
    renderWithIntl(<ArchiveOrganizations query="registry" />);
    expect(
      screen.getByText(
        siteT("orgSearchResults", { count: 1, query: "registry" }),
      ),
    ).toBeVisible();
    expect(screen.queryByText("ORG-A-020748")).toBeNull();
    expect(
      screen.getByRole("link", { name: site.searchClear }),
    ).toHaveAttribute("href", "/en/site/organizations");
  });

  it("says so when no organization matches", () => {
    renderWithIntl(<ArchiveOrganizations query="zzz" />);
    expect(
      screen.getByText(siteT("orgSearchNone", { query: "zzz" })),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: site.searchClear }),
    ).toHaveAttribute("href", "/en/site/organizations");
  });

  it("explains the classes and statuses the index uses", () => {
    renderWithIntl(<ArchiveAbout />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      site.aboutTitle,
    );
    for (const heading of [
      site.aboutUseTitle,
      site.aboutClassesTitle,
      site.aboutStatusesTitle,
      site.aboutClearanceTitle,
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeVisible();
    }
    for (const body of [
      site.aboutClassIncidentBody,
      site.aboutStatusSealedBody,
      site.aboutStatusErasedBody,
    ]) {
      expect(screen.getByText(body)).toBeVisible();
    }
    expect(
      screen.getByRole("link", { name: site.aboutWorkstationLink }),
    ).toHaveAttribute("href", "/en/desktop");
  });

  it("keys a class and a status to the index, with a real code as the example", () => {
    const { container } = renderWithIntl(<ArchiveAbout />);

    // The class name is a filter, and the sample is an entry a reader can open.
    expect(
      screen.getByRole("link", { name: site.classIncident }),
    ).toHaveAttribute("href", "/en/site/records?class=incident");
    expect(
      screen.getByRole("link", { name: site.statusSealed }),
    ).toHaveAttribute("href", "/en/site/records?status=sealed");
    expect(
      screen.getByText(
        ARCHIVE_INDEX.find((entry) => entry.klass === "incident")!.code,
      ),
    ).toBeVisible();

    // The guide's own margin reaches every section it lists.
    const contents = screen
      .getByRole("heading", { name: site.aboutContentsTitle })
      .closest("section")!;
    for (const link of within(contents).getAllByRole("link")) {
      const href = link.getAttribute("href")!;
      expect(container.querySelector(href), href).not.toBeNull();
    }
  });
});

describe("the archive in Korean", () => {
  it("serves the pages in the reader's language and keeps the codes intact", () => {
    renderWithIntl(<ArchiveHome />, { locale: "ko" });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      korean.site.homeTitle,
    );
    const nav = screen.getByRole("navigation", { name: korean.site.navLabel });
    expect(
      within(nav).getByRole("link", { name: korean.site.navRecords }),
    ).toHaveAttribute("href", "/ko/site/records");
  });
});

describe("every link on the plain site", () => {
  it("stays inside the reader's language, and every fragment resolves", () => {
    for (const page of [
      <ArchiveHome key="home" />,
      <ArchiveRecords key="records" />,
      <ArchiveRecord key="record" code="INC-00014" />,
      <ArchiveOrganizations key="organizations" />,
      <ArchiveAbout key="about" />,
    ]) {
      const { container, unmount } = renderWithIntl(page);
      for (const link of screen.getAllByRole("link")) {
        const href = link.getAttribute("href")!;
        if (href.startsWith("#")) {
          expect(container.querySelector(href), href).not.toBeNull();
          continue;
        }
        const url = new URL(href, "https://archive.invalid");
        expect(url.pathname, href).toMatch(
          /^\/(en|ko)(\/site(\/records(\/[A-Z0-9/-]+)?(\/download)?|\/organizations|\/about|\/random|\/write(\/editor)?)?|\/meta(\/about)?|\/desktop|\/sign-in|\/account)?$/,
        );
        // A query is a filter, and only the index and the directory take one.
        for (const key of url.searchParams.keys()) {
          expect(
            ["q", "class", "status", "period", "format"],
            `${href} carries ${key}`,
          ).toContain(key);
        }
      }
      unmount();
    }
  });
});

describe("the record prose renderer", () => {
  it("draws a redaction as a disclosure that needs no script, and drops raw HTML", () => {
    const { container } = renderWithIntl(
      <RecordProse
        source={"A name is ||withheld|| here.\n\n<script>alert(1)</script>"}
        redactionLabel={site.recordRedaction}
        imageNotHeld={site.figureNotHeld}
      />,
    );
    expect(screen.getByText(site.recordRedaction)).toBeVisible();
    expect(screen.getByText("withheld")).toBeInTheDocument();
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).not.toContain("alert(1)");
  });
});

describe("search, random, and downloads", () => {
  it("renders sealed search hits as metadata stubs without body excerpts", () => {
    const state = parseSearchState({ q: "stairwell", type: "incident" });
    renderWithIntl(
      <ArchiveRecords
        state={state}
        outcome={{ status: "success", response: searchFixture(state) }}
      />,
    );
    expect(
      screen.getByRole("link", {
        name: /Stairwell interval, repeated landing/,
      }),
    ).toBeVisible();
    expect(screen.getByText(/acknowledge to reveal/)).toBeVisible();
    expect(screen.queryByText(/Three separate climbs/)).toBeNull();
  });

  it("keeps search filters in pagination links", () => {
    const state = parseSearchState({ limit: "10", page: "2" });
    renderWithIntl(
      <ArchiveRecords
        state={state}
        outcome={{ status: "success", response: searchFixture(state) }}
      />,
    );
    expect(
      screen.getByRole("navigation", { name: site.searchPagination }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: site.searchPrevious }),
    ).toHaveAttribute("href", "/en/site/records?limit=10");
  });

  it("shows a distinct rate-limit state and keeps the query on retry", () => {
    const state = parseSearchState({ q: "door", language: "ko" });
    renderWithIntl(
      <ArchiveRecords state={state} outcome={{ status: "rate-limited" }} />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      site.searchRateLimitTitle,
    );
    expect(
      screen.getByRole("link", { name: site.searchErrorRetry }),
    ).toHaveAttribute("href", "/en/site/records?q=door&language=ko");
  });

  it("filters the index on the server and keeps the query in the address", () => {
    renderWithIntl(<ArchiveRecords query="tide" />);
    expect(
      screen.getByText(siteT("searchResults", { count: 1, query: "tide" })),
    ).toBeVisible();
    expect(
      screen.getByRole("link", {
        name: site.openRecord.replace("{code}", "INC-00907"),
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole("link", {
        name: site.openRecord.replace("{code}", "INC-00014"),
      }),
    ).toBeNull();
  });

  it("says so when nothing matches", () => {
    renderWithIntl(<ArchiveRecords query="zzzz no such record" />);
    expect(
      screen.getByText(siteT("searchNone", { query: "zzzz no such record" })),
    ).toBeVisible();
  });

  it("narrows the index by class, status, and filed range together", () => {
    renderWithIntl(<ArchiveRecords status="sealed" period="current" />);
    // Sealed and filed since 2000: INC-00042 and INC-00204, and nothing else.
    expect(
      screen.getByRole("link", {
        name: site.openRecord.replace("{code}", "INC-00042"),
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", {
        name: site.openRecord.replace("{code}", "INC-00204"),
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole("link", {
        name: site.openRecord.replace("{code}", "CIRCA-M-0002"),
      }),
    ).toBeNull();
    expect(
      screen.getByText(siteT("filteredCount", { count: 2 })),
    ).toBeVisible();
  });

  it("tags each active filter with a link that takes only that filter off", () => {
    renderWithIntl(<ArchiveRecords status="sealed" period="current" />);
    const tags = screen.getByRole("list", { name: site.activeFilters });
    expect(within(tags).getByText(site.statusSealed)).toBeVisible();
    expect(within(tags).getByText(site.periodCurrent)).toBeVisible();

    expect(
      within(tags).getByRole("link", {
        name: siteT("removeFilter", { filter: site.filterStatus }),
      }),
    ).toHaveAttribute("href", "/en/site/records?period=current");
    expect(
      within(tags).getByRole("link", {
        name: siteT("removeFilter", { filter: site.filterFiled }),
      }),
    ).toHaveAttribute("href", "/en/site/records?status=sealed");
    expect(
      within(tags).getByRole("link", { name: site.clearFilters }),
    ).toHaveAttribute("href", "/en/site/records");
  });

  it("keeps the query when a filter is cleared", () => {
    renderWithIntl(<ArchiveRecords query="record" klass="memo" />);
    const tags = screen.getByRole("list", { name: site.activeFilters });
    expect(
      within(tags).getByRole("link", {
        name: siteT("removeFilter", { filter: site.filterClass }),
      }),
    ).toHaveAttribute("href", "/en/site/records?q=record");
  });

  it("says so when the filters find nothing", () => {
    renderWithIntl(<ArchiveRecords klass="memo" status="contested" />);
    expect(screen.getByText(site.filterNone)).toBeVisible();
  });

  it("opens a record the reader did not choose", () => {
    expect(randomRecordCode(() => 0)).toBe(ARCHIVE_INDEX[0].code);
    expect(randomRecordCode(() => 0.999999)).toBe(
      ARCHIVE_INDEX[ARCHIVE_INDEX.length - 1].code,
    );
  });

  it("serves a released filing as text and Markdown, and refuses a held one", async () => {
    const markdown = await downloadRecord(
      new Request(
        "http://localhost/en/site/records/INC-00014/download?format=md",
      ),
      { params: Promise.resolve({ lang: "en", code: "INC-00014" }) },
    );
    expect(markdown.status).toBe(200);
    expect(markdown.headers.get("content-type")).toMatch(/text\/markdown/);
    expect(markdown.headers.get("content-disposition")).toContain(
      "INC-00014.md",
    );
    expect(await markdown.text()).toContain("Eleven wagons left the yard");

    const text = await downloadRecord(
      new Request(
        "http://localhost/en/site/records/INC-00014/download?format=txt",
      ),
      { params: Promise.resolve({ lang: "en", code: "INC-00014" }) },
    );
    expect(text.status).toBe(200);
    expect(await text.text()).toContain("Eleven wagons left the yard");

    const held = await downloadRecord(
      new Request(
        "http://localhost/en/site/records/INC-00118/download?format=txt",
      ),
      { params: Promise.resolve({ lang: "en", code: "INC-00118" }) },
    );
    expect(held.status).toBe(404);
  });
});

describe("the record's tools and notes", () => {
  it("puts notes, download, and the record's other tools above the text", () => {
    renderWithIntl(<ArchiveRecord code="INC-00042" />);
    const tools = screen.getByRole("navigation", { name: site.recordActions });
    expect(
      within(tools).getByRole("link", {
        name: site.actionNotes.replace("{count}", "2"),
      }),
    ).toHaveAttribute("href", "#notes");
    expect(within(tools).getByText(site.actionDownload)).toBeVisible();
    expect(
      within(tools).getByRole("link", { name: site.actionIndex }),
    ).toHaveAttribute("href", "/en/site/records");
    expect(
      within(tools).getByRole("link", { name: new RegExp(site.actionRandom) }),
    ).toHaveAttribute("href", "/en/site/random");
  });

  it("lists the notes filed against a record at the foot of the page", () => {
    renderWithIntl(<ArchiveRecord code="INC-00042" />);
    expect(
      screen.getByRole("heading", { name: site.notesTitle }),
    ).toBeVisible();
    expect(screen.getByText("M. Okafor")).toBeVisible();
    expect(
      screen.getByText(/Two of the three climbs were counted/),
    ).toBeVisible();
    expect(screen.getByText("H. Kim")).toBeVisible();
  });

  it("says when a record carries no notes", () => {
    renderWithIntl(<ArchiveRecord code="INC-00014" />);
    expect(screen.getByText(site.notesEmpty)).toBeVisible();
  });

  it("holds a note the reader writes, stamped as not filed", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ArchiveRecord code="INC-00014" />);

    const composer = screen.getByRole("form", {
      name: siteT("noteComposerTitle", { code: "INC-00014" }),
    });
    const submit = within(composer).getByRole("button", {
      name: site.noteSubmit,
    });
    expect(submit).toBeDisabled();

    await user.type(within(composer).getByLabelText(site.noteName), "E. Park");
    await user.type(
      within(composer).getByLabelText(site.noteBody),
      "The twelfth wagon is in the yard ledger after all.",
    );
    expect(submit).toBeEnabled();
    await user.click(submit);

    // The note is on the page, but it says which copy it is.
    expect(screen.getByText("E. Park")).toBeVisible();
    expect(screen.getByText(site.noteDraft)).toBeVisible();
    expect(
      screen.getByText(/twelfth wagon is in the yard ledger/),
    ).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(site.noteHeld);
    expect(screen.queryByText(site.notesEmpty)).toBeNull();

    // And it can be taken away again, because the archive never received it.
    await user.click(
      screen.getByRole("button", { name: new RegExp(site.noteDiscard) }),
    );
    expect(
      screen.queryByText(/twelfth wagon is in the yard ledger/),
    ).toBeNull();
    expect(screen.getByText(site.notesEmpty)).toBeVisible();
  });

  it("names the note's author when the reader leaves the name out", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ArchiveRecord code="INC-00014" />);
    const composer = screen.getByRole("form", {
      name: siteT("noteComposerTitle", { code: "INC-00014" }),
    });
    await user.type(
      within(composer).getByLabelText(site.noteBody),
      "An unsigned observation.",
    );
    await user.click(
      within(composer).getByRole("button", { name: site.noteSubmit }),
    );
    expect(screen.getByText(site.noteAnonymous)).toBeVisible();
  });

  it("replies to a filed note in the viewer's own words", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ArchiveRecord code="INC-00042" />);

    const replyTo = site.noteReplyTo.replace("{author}", "M. Okafor");
    await user.click(screen.getByRole("button", { name: replyTo }));

    // The composer says who it is filing against, and the reply is filed from it.
    const composer = screen.getByRole("form", { name: replyTo });
    await user.type(
      within(composer).getByLabelText(site.noteBody),
      "The third count was the one that mattered.",
    );
    await user.click(
      within(composer).getByRole("button", { name: site.noteSubmit }),
    );

    expect(
      screen.getByText(/The third count was the one that mattered/),
    ).toBeVisible();
    expect(screen.getByText(site.noteDraft)).toBeVisible();
    expect(
      screen.getByRole("form", {
        name: siteT("noteComposerTitle", { code: "INC-00042" }),
      }),
    ).toBeVisible();
  });

  it("offers a copy of a released filing but not of a held one", () => {
    const { unmount } = renderWithIntl(<ArchiveRecord code="INC-00014" />);
    expect(
      screen.getByRole("link", { name: site.downloadText }),
    ).toHaveAttribute("href", "/en/site/records/INC-00014/download?format=txt");
    expect(
      screen.getByRole("link", { name: site.downloadMarkdown }),
    ).toHaveAttribute("href", "/en/site/records/INC-00014/download?format=md");
    unmount();

    renderWithIntl(<ArchiveRecord code="INC-00118" />);
    expect(screen.getByText(site.downloadHeld)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: site.downloadMarkdown }),
    ).toBeNull();
  });
});

describe("the project page", () => {
  const meta = english.meta;

  it("opens on the dossier premise, its three facts, and an index of the account", () => {
    renderWithIntl(<MetaAbout />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      `${meta.aboutPageTitleA} ${meta.aboutPageTitleB}`,
    );
    expect(screen.getByText(meta.aboutPageLede)).toBeVisible();
    expect(screen.getByRole("link", { name: meta.brand })).toHaveAttribute(
      "href",
      "/en/meta",
    );
    const register = screen.getAllByRole("definition")[0].closest("dl")!;
    expect(within(register).getByText(meta.aboutFactStatusValue)).toBeVisible();
    expect(within(register).getByText(meta.aboutFactLicenceTerm)).toBeVisible();

    const index = screen.getByRole("navigation", {
      name: meta.aboutIndexLabel,
    });
    expect(within(index).getAllByRole("link")).toHaveLength(9);
    expect(
      within(index).getByRole("link", { name: new RegExp(meta.navLicence) }),
    ).toHaveAttribute("href", "#licence");
  });

  it("shows a real record as evidence, not as a claim", () => {
    renderWithIntl(<MetaAbout />);

    expect(screen.getByText(meta.specimenCode)).toBeVisible();
    expect(
      screen.getByRole("heading", { name: meta.specimenTitle }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: new RegExp(meta.specimenLink) }),
    ).toHaveAttribute("href", `/en/site/records/${meta.specimenCode}`);
  });

  it("describes the editions, the build, contributing, and support", () => {
    renderWithIntl(<MetaAbout />);

    for (const heading of [
      meta.premiseTitle,
      meta.editionsTitle,
      meta.builtTitle,
      meta.contributeTitle,
      meta.contributorsTitle,
      meta.supportTitle,
      meta.faqTitle,
      meta.contactTitle,
      meta.licenceTitle,
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeVisible();
    }
    expect(screen.getByText(meta.quote)).toBeVisible();
    expect(screen.getByText(meta.supportPromise)).toBeVisible();
  });

  it("credits the maintainer, with an avatar group and the next place open", () => {
    renderWithIntl(<MetaAbout />);

    const section = screen.getByRole("region", {
      name: meta.contributorsTitle,
    });
    const group = within(section).getByRole("group", {
      name: meta.contributorsOnFile,
    });
    expect(group.querySelectorAll('[data-slot="avatar"]')).toHaveLength(2);
    expect(
      within(section).getByRole("heading", { name: /KavinduNirmal/ }),
    ).toBeVisible();
    expect(
      within(section).getByRole("heading", { name: meta.contributorsOpenName }),
    ).toBeVisible();
    expect(
      within(section).getAllByText(meta.contributorsMaintainerRole).length,
    ).toBeGreaterThan(0);
    expect(
      within(section).getByRole("link", {
        name: new RegExp(meta.contributorsProfile),
      }),
    ).toHaveAttribute("href", PROJECT_LINKS.repository);
    expect(
      within(section).getByRole("link", {
        name: new RegExp(meta.contributorsLink),
      }),
    ).toHaveAttribute("href", "#contribute");
  });

  it("separates the code licence from the fiction's licence", () => {
    renderWithIntl(<MetaAbout />);

    expect(screen.getByRole("link", { name: /MIT/ })).toHaveAttribute(
      "href",
      LICENCES.code.href,
    );
    expect(
      screen.getByRole("link", { name: new RegExp(LICENCES.content.name) }),
    ).toHaveAttribute("href", LICENCES.content.href);
    for (const term of [
      meta.licenceFiction,
      meta.licenceAccounts,
      meta.licenceCookie,
      meta.licenceWarranty,
    ]) {
      expect(screen.getByText(term)).toBeVisible();
    }
  });

  it("answers the questions a reader actually asks", () => {
    const { container } = renderWithIntl(<MetaAbout />);

    const questions = container.querySelectorAll("details");
    expect(questions).toHaveLength(6);
    expect(screen.getByText(meta.faqRealQ)).toBeVisible();
    expect(screen.getByText(meta.faqRealA)).toBeInTheDocument();
  });

  it("offers a defect, a proposal, and a way to write to the maintainers", () => {
    renderWithIntl(<MetaAbout />);

    for (const [action, href] of [
      [meta.channelBugAction, ISSUES.bug],
      [meta.channelFeatureAction, ISSUES.feature],
      [meta.channelContactAction, ISSUES.contact],
    ] as const) {
      expect(
        screen.getByRole("link", { name: new RegExp(action) }),
      ).toHaveAttribute("href", href);
    }
  });

  it("keeps one language per page and every link resolvable", () => {
    const { container } = renderWithIntl(<MetaAbout />);

    for (const link of screen.getAllByRole("link")) {
      const href = link.getAttribute("href")!;
      if (href.startsWith("#")) {
        expect(container.querySelector(href), href).not.toBeNull();
        continue;
      }
      if (/^https?:/.test(href)) {
        expect(link).toHaveAttribute("target", "_blank");
        expect(link.getAttribute("rel")).toContain("noreferrer");
        continue;
      }
      expect(href, href).toMatch(
        /^\/(en|ko)(\/(site(\/records(\/[A-Z0-9/-]+)?(\/download)?|\/organizations|\/about|\/random|\/editor)?|meta(\/(about|documentation(\/[a-z-]+)?))?|desktop))?$/,
      );
    }
  });

  it("answers in Korean when the reader asked for Korean", () => {
    renderWithIntl(<MetaAbout />, { locale: "ko" });

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      `${korean.meta.aboutPageTitleA} ${korean.meta.aboutPageTitleB}`,
    );
    expect(screen.getByText(korean.meta.quote)).toBeVisible();
    expect(screen.getByText(korean.meta.supportPromise)).toBeVisible();
  });
});

it("cycles warning tags through include, exclude and unchecked inside collapsed filters", async () => {
  const { SiteSearch } = await import("@/components/archive-site/site-search");
  const user = userEvent.setup();
  const view = renderWithIntl(<SiteSearch />);
  const disclosure = view.container.querySelector("details")!;
  expect(disclosure.open).toBe(false);
  await user.click(screen.getByText("Filters", { exact: true }));
  expect(disclosure.open).toBe(true);
  const checkbox = screen.getByRole("checkbox", { name: /Graphic violence/ });
  const form = view.container.querySelector("form")!;
  await user.click(checkbox);
  expect(new FormData(form).getAll("warnTag")).toEqual(["graphic-violence"]);
  await user.click(checkbox);
  expect(checkbox).toHaveAttribute("aria-checked", "mixed");
  expect(new FormData(form).getAll("warnTag")).toEqual([]);
  expect(new FormData(form).getAll("excludeWarnTag")).toEqual([
    "graphic-violence",
  ]);
  await user.click(checkbox);
  expect(checkbox).toHaveAttribute("aria-checked", "false");
  expect(new FormData(form).getAll("excludeWarnTag")).toEqual([]);
});

it("keeps search result types and warning indicators distinct from severity labels", () => {
  const state = parseSearchState({});
  const response = searchFixture(state);
  renderWithIntl(
    <ArchiveRecords state={state} outcome={{ status: "success", response }} />,
  );
  const table = screen.getByRole("table");
  expect(
    within(table).queryByRole("columnheader", {
      name: english.site.columnHolder,
    }),
  ).not.toBeInTheDocument();
  expect(
    within(table).getByRole("columnheader", {
      name: english.site.searchWarningTags,
    }),
  ).toBeInTheDocument();
  for (const item of response.items) {
    const row = within(table).getByText(item.displayCode).closest("tr")!;
    const cells = within(row).getAllByRole("cell");
    expect(cells[1]).not.toHaveTextContent("·");
    const types = cells[1].querySelectorAll("[data-klass]");
    expect(types).toHaveLength(item.class ? 2 : 1);
    expect(types[0]).toHaveAttribute("data-klass", item.type);
    if (item.class) expect(types[1]).toHaveAttribute("data-klass", item.class);
    expect(cells[2].querySelector("[data-warning]")).toBeInTheDocument();
    expect(cells[3].querySelector("[data-tier]")).toHaveAttribute(
      "data-tier",
      item.warning.tier,
    );
    expect(cells[3]).not.toHaveTextContent(/^(Red|Yellow|Green):/);
  }
});

it("shows an approved sealed record excerpt without an access-request notice", () => {
  const state = parseSearchState({});
  const response = searchFixture(state);
  response.items = [
    {
      ...response.items[0],
      type: "record",
      class: "exploration",
      status: "sealed",
      access: "sealed",
      redacted: false,
      excerpt: "Approved filing prose",
      highlights: [],
      warning: { tier: null, disclosure: null, tags: [] },
    },
  ];
  renderWithIntl(
    <ArchiveRecords state={state} outcome={{ status: "success", response }} />,
  );
  expect(screen.getByText("Approved filing prose")).toBeVisible();
  expect(
    screen.queryByText(new RegExp(site.searchSealedRecord)),
  ).not.toBeInTheDocument();
});
