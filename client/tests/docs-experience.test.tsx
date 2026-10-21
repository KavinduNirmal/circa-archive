import { screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DocsPage } from "@/components/meta/docs/docs-page";
import { docTopic } from "@/components/meta/docs/docs-topics";
import { renderWithIntl } from "./intl";
const entries = [
  {
    slug: "records",
    markdown:
      "# Records\n\n## Live heading\n\n> [!WARNING]\n> Read carefully.\n\n| A | B |\n| - | - |\n| one | two |\n\n[Rendering](rendering.md#plugins)\n\n<script>alert(1)</script>",
  },
  {
    slug: "rendering",
    markdown: "# Rendering\n\nA unique needle in another document.",
  },
];
const page = () => (
  <DocsPage topic={docTopic("records")!} documents={entries} locale="en" />
);
describe("repository documentation experience", () => {
  it("renders source headings, GFM, alerts and relative links safely", () => {
    const { container } = renderWithIntl(page());
    expect(
      screen.getByRole("heading", { name: "Live heading" }),
    ).toHaveAttribute("id", "live-heading");
    expect(screen.getByRole("table")).toBeVisible();
    expect(container.querySelector('[data-alert="warning"]')).toHaveTextContent(
      "Read carefully.",
    );
    expect(screen.getByRole("link", { name: "Rendering" })).toHaveAttribute(
      "href",
      "/en/meta/documentation/rendering#plugins",
    );
    expect(container.querySelector("script")).toBeNull();
  });
  it("keeps heading anchors consistent after frontmatter and repeated titles", () => {
    renderWithIntl(
      <DocsPage
        topic={docTopic("records")!}
        documents={[
          {
            slug: "records",
            markdown:
              "---\ntitle: metadata\n---\n\n# Repeated\n\n## Repeated\n\n## Repeated",
          },
        ]}
        locale="en"
      />,
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.map((heading) => heading.id)).toEqual([
      "repeated-1",
      "repeated-2",
    ]);
    expect(
      within(screen.getByRole("navigation", { name: "On this page" }))
        .getAllByRole("link", { name: /Repeated/ })
        .map((link) => link.getAttribute("href")),
    ).toEqual(["#repeated-1", "#repeated-2"]);
  });
  it("reports clipboard rejection", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(
      new Error("denied"),
    );
    renderWithIntl(page());
    await user.click(screen.getByRole("button", { name: "Copy Markdown" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Could not copy Markdown",
    );
  });
  it("renders highlighting with ==text==, brand-callout, brand list, and outgoing link icons", () => {
    const customMarkdown =
      "# Records\n\nThis is ==Highlighted text== in prose.\n\n```brand-callout\nSpecial brand message\n```\n\n```brand list\n- [Rendering](rendering.md) — Card description\n```";
    const { container } = renderWithIntl(
      <DocsPage
        topic={docTopic("records")!}
        documents={[{ slug: "records", markdown: customMarkdown }]}
        locale="en"
      />,
    );
    const highlight = container.querySelector("mark");
    expect(highlight).not.toBeNull();
    expect(highlight).toHaveTextContent("Highlighted text");
    expect(container.querySelector('[data-brand="callout"]')).toBeVisible();
    expect(container.querySelector('[data-brand="list"]')).toBeVisible();
    expect(container.querySelector(".meta-doc-link-icon")).not.toBeNull();
  });
  it("places actions under the title in the article header and source history in the article footer without meta-docs-band", () => {
    const { container } = renderWithIntl(
      <DocsPage
        topic={docTopic("records")!}
        documents={entries}
        locale="en"
        updatedAt="2026-10-15T10:00:00Z"
      />,
    );
    expect(container.querySelector(".meta-docs-band")).toBeNull();
    const header = container.querySelector(".meta-doc-header") as HTMLElement;
    expect(
      within(header).getByRole("button", { name: "Copy Markdown" }),
    ).toBeVisible();
    expect(
      within(header).getByRole("link", { name: "Edit documentation" }),
    ).toBeVisible();
    expect(
      within(header).getByRole("link", { name: "Open in ChatGPT" }),
    ).toBeVisible();
    const footer = container.querySelector(
      ".meta-doc-source-footer",
    ) as HTMLElement;
    expect(
      within(footer).getByText("Last updated on Oct 15, 2026"),
    ).toBeVisible();
    expect(
      within(footer).getByRole("link", { name: "Edit documentation" }),
    ).toBeVisible();
  });
  it("copies question context when opening ChatGPT without auto-sending it", async () => {
    const user = userEvent.setup();
    const copy = vi.spyOn(navigator.clipboard, "writeText");
    renderWithIntl(page());
    const link = screen.getByRole("link", { name: "Open in ChatGPT" });
    expect(link).toHaveAttribute("href", "https://chatgpt.com/");
    expect(link).toHaveAttribute("target", "_blank");
    await user.click(link);
    expect(copy).toHaveBeenCalledWith(
      expect.stringContaining(entries[0].markdown),
    );
    expect(copy).toHaveBeenCalledWith(
      expect.stringContaining("/blob/develop/docs/documentation/en/records.md"),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Paste");
  });
  it("copies the exact source and opens its edit address", async () => {
    const user = userEvent.setup();
    const copy = vi.spyOn(navigator.clipboard, "writeText");
    renderWithIntl(page());
    await user.click(screen.getByRole("button", { name: "Copy Markdown" }));
    expect(copy).toHaveBeenCalledWith(entries[0].markdown);
    expect(
      screen.getAllByRole("link", { name: "Edit documentation" })[0],
    ).toHaveAttribute(
      "href",
      "https://github.com/KavinduNirmal/circa-archive/edit/develop/docs/documentation/en/records.md",
    );
  });
  it("searches all documents and focuses search with Control+K", async () => {
    const user = userEvent.setup();
    const { container } = renderWithIntl(page());
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const desktop = container.querySelector(
      ".meta-docs-sidebar-inner",
    ) as HTMLElement;
    const search = within(desktop).getByRole("searchbox");
    expect(search).toHaveFocus();
    await user.type(search, "unique needle");
    expect(
      within(desktop).getByRole("link", { name: /Rendering pipeline/ }),
    ).toBeVisible();
    expect(
      within(desktop).queryByRole("link", { name: /Writing a record/ }),
    ).toBeNull();
  });
  it("shows a recoverable failure without copy controls for missing source", () => {
    renderWithIntl(
      <DocsPage topic={docTopic("records")!} documents={[]} locale="en" />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("could not");
    expect(screen.queryByRole("button", { name: "Copy Markdown" })).toBeNull();
    expect(screen.getByRole("link", { name: "Retry" })).toBeVisible();
  });
  it("displays search result warning in the search interface when partial and keeps it out of article content", async () => {
    const user = userEvent.setup();
    const partialEntries = [
      { slug: "records", markdown: "# Records\n\nArticle paragraph content." },
      { slug: "rendering", markdown: null },
    ];
    const { container } = renderWithIntl(
      <DocsPage
        topic={docTopic("records")!}
        documents={partialEntries}
        locale="en"
      />,
    );
    const article = container.querySelector("article.meta-doc") as HTMLElement;
    expect(
      within(article).queryByText(/Search results may be incomplete/),
    ).toBeNull();

    const desktop = container.querySelector(
      ".meta-docs-sidebar-inner",
    ) as HTMLElement;
    const search = within(desktop).getByRole("searchbox");
    await user.type(search, "article");
    expect(
      within(desktop).getByText(
        "Some documents are unavailable. Search results may be incomplete.",
      ),
    ).toBeVisible();
  });
});
