import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArchiveHome } from "@/components/archive-site/archive-home";
import { ArchiveAbout } from "@/components/archive-site/archive-about";
import { ArchiveOrganizations } from "@/components/archive-site/archive-organizations";
import { ArchiveRecord } from "@/components/archive-site/archive-record";
import { ArchiveRecords } from "@/components/archive-site/archive-records";
import { MetaAbout } from "@/components/meta/meta-about";
import { RecordProse } from "@/components/archive-site/record-prose";
import { mostConsulted, randomRecordCode } from "@/components/archive-site/archive-data";
import { ARCHIVE_INDEX, recentFilings } from "@/components/browser/archive-index";
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

const english = catalogFor("en");
const korean = catalogFor("ko");
const site = english.site;
const siteT = translatorFor("site");

const entryFor = (code: string) => ARCHIVE_INDEX.find((entry) => entry.code === code)!;

describe("the archive home", () => {
  it("offers the index, the organizations, and the workstation as ordinary links", () => {
    renderWithIntl(<ArchiveHome />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(site.homeTitle);

    const nav = screen.getByRole("navigation", { name: site.navLabel });
    for (const [name, href] of [
      [site.navArchive, "/en/site"],
      [site.navRecords, "/en/site/records"],
      [site.navOrganizations, "/en/site/organizations"],
      [site.navAbout, "/en/site/about"],
      [site.actionRandom, "/en/site/random"],
      [site.navWorkstation, "/en/desktop"],
    ] as const) {
      expect(within(nav).getByRole("link", { name })).toHaveAttribute("href", href);
    }
    // The project page is reachable from the masthead and says that it is the project page.
    expect(screen.getAllByRole("link", { name: site.aboutSite })[0]).toHaveAttribute("href", "/en/meta/about");
  });

  it("puts the search in the masthead and again in the page, as a plain form", () => {
    renderWithIntl(<ArchiveHome />);
    const searches = screen.getAllByRole("search");
    expect(searches).toHaveLength(2);
    for (const form of searches) {
      expect(form).toHaveAttribute("action", "/en/site/records");
      expect(form).toHaveAttribute("method", "get");
      expect(within(form).getByRole("searchbox", { name: site.searchLabel })).toHaveAttribute("name", "q");
    }
  });

  it("announces the site notice and offers the featured, popular, and random doors", () => {
    renderWithIntl(<ArchiveHome />);
    expect(screen.getByText(site.bannerLabel)).toBeVisible();
    expect(screen.getByText(site.bannerText)).toBeVisible();
    expect(screen.getByRole("heading", { name: site.featuredTitle })).toBeVisible();
    expect(screen.getByRole("heading", { name: site.popularTitle })).toBeVisible();
    expect(screen.getByRole("heading", { name: site.randomTitle })).toBeVisible();
    for (const { entry } of mostConsulted(3)) {
      expect(screen.getAllByText(entry.designation ?? entry.code).length).toBeGreaterThan(0);
    }
    expect(screen.getAllByRole("link", { name: new RegExp(site.randomLink) })[0]).toHaveAttribute("href", "/en/site/random");
  });

  it("shows what was most recently filed and how much the index holds", () => {
    renderWithIntl(<ArchiveHome />);
    for (const entry of recentFilings(ARCHIVE_INDEX, 5)) {
      expect(screen.getAllByText(new RegExp(entry.code)).length).toBeGreaterThan(0);
    }
    expect(screen.getByRole("link", { name: site.homeIndexLink })).toHaveAttribute("href", "/en/site/records");
    expect(screen.getAllByText(site.homeCount.replace("{count}", String(ARCHIVE_INDEX.length))).length).toBeGreaterThan(0);
  });
});

describe("the index of records", () => {
  it("lists every released entry and opens each on its own page", () => {
    renderWithIntl(<ArchiveRecords />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(site.indexTitle);

    for (const entry of ARCHIVE_INDEX) {
      const name = site.openRecord.replace("{code}", entry.code);
      expect(screen.getAllByRole("link", { name }).length, entry.code).toBeGreaterThan(0);
      expect(screen.getAllByRole("link", { name })[0], entry.code).toHaveAttribute("href", `/en/site/records/${entry.code}`);
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
});

describe("a released record", () => {
  it("renders its filed prose, its sections, and the records filed against it", () => {
    const entry = entryFor("INC-00014");
    renderWithIntl(<ArchiveRecord code={entry.code} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(entry.designation!);
    expect(screen.getAllByText(site.recordLabel).length).toBeGreaterThan(0);
    expect(screen.getAllByText(entry.code).length).toBeGreaterThan(0);

    // Section headings come from the filing, not from a constant.
    expect(screen.getByRole("heading", { name: "Brief", level: 2 })).toBeVisible();
    expect(screen.getByRole("heading", { name: "The waybill", level: 2 })).toBeVisible();
    expect(screen.getByText(/The discrepancy is in the number of vehicles/)).toBeVisible();
    expect(screen.getByText(/The train was complete at both ends/)).toBeVisible();

    // The two directions of the citation web stay apart.
    expect(screen.getByText(site.recordInbound)).toBeVisible();
    expect(screen.getByText(site.recordOutbound)).toBeVisible();
    expect(screen.getByRole("link", { name: /INC-00042/ })).toHaveAttribute("href", "/en/site/records/INC-00042");
    expect(screen.getByRole("link", { name: /INC-00063/ })).toHaveAttribute("href", "/en/site/records/INC-00063");
  });

  it("holds a sealed section at the desk and never prints its prose", () => {
    renderWithIntl(<ArchiveRecord code="INC-00042" />);
    expect(screen.getByRole("heading", { name: "Disposition", level: 2 })).toBeVisible();
    expect(screen.getByText(/Sealed at Level 5 on 2001-03-04/)).toBeVisible();
  });

  it("releases only the index entry for a filing that is held", () => {
    renderWithIntl(<ArchiveRecord code="INC-00118" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(site.withheldDesignation);
    expect(screen.getByText(site.recordHeldTitle)).toBeVisible();
    expect(screen.getByText(site.recordHeldBody)).toBeVisible();
    expect(screen.getByText(/The designation is withheld at Level 5/)).toBeVisible();
  });

  it("renders the corpus's table, figures, and redactions as plain HTML", () => {
    renderWithIntl(<ArchiveRecord code="CIRCA-S-03007" />);
    expect(screen.getByRole("table")).toBeVisible();
    expect(screen.getByText(/Figure 1\. The door, photographed/)).toBeVisible();
    expect(screen.getAllByText(site.recordRedaction).length).toBeGreaterThan(0);
  });

  it("gives every section an anchor and a contents list that reaches it", () => {
    const { container } = renderWithIntl(<ArchiveRecord code="INC-00014" />);
    const contents = screen.getByRole("navigation", { name: site.recordContents });
    const links = within(contents).getAllByRole("link");
    expect(links.length).toBeGreaterThan(1);
    for (const link of links) {
      const href = link.getAttribute("href")!;
      expect(container.querySelector(href), href).not.toBeNull();
    }
  });
});

describe("the archive's directories", () => {
  it("lists every organization with the filings it holds", () => {
    renderWithIntl(<ArchiveOrganizations />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(site.orgTitle);

    const organizations = ARCHIVE_INDEX.filter((entry) => entry.klass === "organization");
    for (const organization of organizations) {
      const holdings = ARCHIVE_INDEX.filter((entry) => entry.organization === organization.code).length;
      expect(screen.getAllByText(new RegExp(organization.code)).length, organization.code).toBeGreaterThan(0);
      if (holdings > 0) {
        expect(screen.getAllByText(siteT("orgFilings", { count: holdings })).length).toBeGreaterThan(0);
      }
      expect(screen.getAllByRole("link", { name: site.orgOpen })[0]).toBeVisible();
    }
  });

  it("explains the classes and statuses the index uses", () => {
    renderWithIntl(<ArchiveAbout />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(site.aboutTitle);
    for (const heading of [site.aboutUseTitle, site.aboutClassesTitle, site.aboutStatusesTitle, site.aboutClearanceTitle]) {
      expect(screen.getByRole("heading", { name: heading })).toBeVisible();
    }
    for (const body of [site.aboutClassIncidentBody, site.aboutStatusSealedBody, site.aboutStatusErasedBody]) {
      expect(screen.getByText(body)).toBeVisible();
    }
    expect(screen.getByRole("link", { name: site.aboutWorkstationLink })).toHaveAttribute("href", "/en/desktop");
  });
});

describe("the archive in Korean", () => {
  it("serves the pages in the reader's language and keeps the codes intact", () => {
    renderWithIntl(<ArchiveHome />, { locale: "ko" });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(korean.site.homeTitle);
    const nav = screen.getByRole("navigation", { name: korean.site.navLabel });
    expect(within(nav).getByRole("link", { name: korean.site.navRecords })).toHaveAttribute("href", "/ko/site/records");
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
        if (href.startsWith("#")) expect(container.querySelector(href), href).not.toBeNull();
        else expect(href, href).toMatch(/^\/(en|ko)(\/site(\/records(\/[A-Z0-9/-]+)?(\/download\?format=(txt|md))?|\/organizations|\/about|\/random)?|\/meta\/about|\/desktop)?(#[-\w]+)?$/);
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
  it("filters the index on the server and keeps the query in the address", () => {
    renderWithIntl(<ArchiveRecords query="tide" />);
    expect(screen.getByText(siteT("searchResults", { count: 1, query: "tide" }))).toBeVisible();
    expect(screen.getByRole("link", { name: site.openRecord.replace("{code}", "INC-00907") })).toBeVisible();
    expect(screen.queryByRole("link", { name: site.openRecord.replace("{code}", "INC-00014") })).toBeNull();
  });

  it("says so when nothing matches", () => {
    renderWithIntl(<ArchiveRecords query="zzzz no such record" />);
    expect(screen.getByText(siteT("searchNone", { query: "zzzz no such record" }))).toBeVisible();
  });

  it("opens a record the reader did not choose", () => {
    expect(randomRecordCode(() => 0)).toBe(ARCHIVE_INDEX[0].code);
    expect(randomRecordCode(() => 0.999999)).toBe(ARCHIVE_INDEX[ARCHIVE_INDEX.length - 1].code);
  });

  it("serves a released filing as text and Markdown, and refuses a held one", async () => {
    const markdown = await downloadRecord(
      new Request("http://localhost/en/site/records/INC-00014/download?format=md"),
      { params: Promise.resolve({ lang: "en", code: "INC-00014" }) },
    );
    expect(markdown.status).toBe(200);
    expect(markdown.headers.get("content-type")).toMatch(/text\/markdown/);
    expect(markdown.headers.get("content-disposition")).toContain("INC-00014.md");
    expect(await markdown.text()).toContain("Eleven wagons left the yard");

    const text = await downloadRecord(
      new Request("http://localhost/en/site/records/INC-00014/download?format=txt"),
      { params: Promise.resolve({ lang: "en", code: "INC-00014" }) },
    );
    expect(text.status).toBe(200);
    expect(await text.text()).toContain("Eleven wagons left the yard");

    const held = await downloadRecord(
      new Request("http://localhost/en/site/records/INC-00118/download?format=txt"),
      { params: Promise.resolve({ lang: "en", code: "INC-00118" }) },
    );
    expect(held.status).toBe(404);
  });
});

describe("the record's tools and notes", () => {
  it("puts notes, download, and the record's other tools above the text", () => {
    renderWithIntl(<ArchiveRecord code="INC-00042" />);
    const tools = screen.getByRole("navigation", { name: site.recordActions });
    expect(within(tools).getByRole("link", { name: site.actionNotes.replace("{count}", "2") })).toHaveAttribute("href", "#notes");
    expect(within(tools).getByText(site.actionDownload)).toBeVisible();
    expect(within(tools).getByRole("link", { name: site.actionIndex })).toHaveAttribute("href", "/en/site/records");
    expect(within(tools).getByRole("link", { name: new RegExp(site.actionRandom) })).toHaveAttribute("href", "/en/site/random");
  });

  it("lists the notes filed against a record at the foot of the page", () => {
    renderWithIntl(<ArchiveRecord code="INC-00042" />);
    expect(screen.getByRole("heading", { name: site.notesTitle })).toBeVisible();
    expect(screen.getByText("M. Okafor")).toBeVisible();
    expect(screen.getByText(/Two of the three climbs were counted/)).toBeVisible();
    expect(screen.getByText("H. Kim")).toBeVisible();
  });

  it("says when a record carries no notes", () => {
    renderWithIntl(<ArchiveRecord code="INC-00014" />);
    expect(screen.getByText(site.notesEmpty)).toBeVisible();
  });

  it("offers a copy of a released filing but not of a held one", () => {
    const { unmount } = renderWithIntl(<ArchiveRecord code="INC-00014" />);
    expect(screen.getByRole("link", { name: site.downloadText })).toHaveAttribute("href", "/en/site/records/INC-00014/download?format=txt");
    expect(screen.getByRole("link", { name: site.downloadMarkdown })).toHaveAttribute("href", "/en/site/records/INC-00014/download?format=md");
    unmount();

    renderWithIntl(<ArchiveRecord code="INC-00118" />);
    expect(screen.getByText(site.downloadHeld)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: site.downloadMarkdown })).toBeNull();
  });
});

describe("the project page", () => {
  it("describes the fiction and the two editions, and links back into the site", () => {
    const meta = catalogFor("en").meta;
    renderWithIntl(<MetaAbout />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(meta.title);
    expect(screen.getByText(meta.outside)).toBeVisible();
    expect(screen.getByText(meta.honestyBody)).toBeVisible();
    expect(screen.getAllByRole("link", { name: new RegExp(meta.backArchive) })[0]).toHaveAttribute("href", "/en/site");
    expect(screen.getByRole("link", { name: new RegExp(meta.backWorkstation) })).toHaveAttribute("href", "/en/desktop");
    for (const heading of [meta.whatTitle, meta.fictionTitle, meta.editionsTitle, meta.builtTitle, meta.honestyTitle]) {
      expect(screen.getByRole("heading", { name: heading })).toBeVisible();
    }
  });
});
