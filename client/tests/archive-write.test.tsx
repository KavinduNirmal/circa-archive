import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { ArchiveWrite } from "@/components/archive-site/archive-write";
import { createDraft } from "@/lib/incident-editor/model";
import { renderWithIntl } from "./intl";

it("offers incident writing, guidance, and four unavailable creation actions", async () => {
  const storage = { load: vi.fn().mockResolvedValue(null), save: vi.fn() };
  renderWithIntl(<ArchiveWrite storage={storage} />);
  expect(
    screen.getByRole("link", { name: /Write an incident/ }),
  ).toHaveAttribute("href", "/en/site/write/editor");
  expect(
    screen.getByRole("link", {
      name: /Read the guidelines and filing rules first/,
    }),
  ).toHaveAttribute("href", "/en/meta/documentation/author-guide");
  for (const name of [
    "Add Evidence",
    "Create a character",
    "Create an organization",
    "Write a rumour",
  ]) {
    expect(
      screen.getByRole("button", { name: new RegExp(name) }),
    ).toBeDisabled();
  }
  expect(await screen.findByText("No drafts yet.")).toBeVisible();
  expect(storage.save).not.toHaveBeenCalled();
});

it("lists the existing local draft with a resume link without changing it", async () => {
  const draft = createDraft();
  draft.form.designation = "The ninth platform";
  const storage = { load: vi.fn().mockResolvedValue(draft), save: vi.fn() };
  renderWithIntl(<ArchiveWrite storage={storage} />);
  expect(
    await screen.findByRole("link", { name: /The ninth platform/ }),
  ).toHaveAttribute("href", "/en/site/write/editor");
  expect(storage.save).not.toHaveBeenCalled();
});

it("distinguishes unavailable storage from an empty draft list", async () => {
  renderWithIntl(
    <ArchiveWrite
      storage={{
        load: vi.fn().mockRejectedValue(new Error("blocked")),
        save: vi.fn(),
      }}
    />,
  );
  expect(
    await screen.findByText(
      "Drafts could not be read. Your saved copy has not been changed.",
    ),
  ).toBeVisible();
  expect(screen.queryByText("No drafts yet.")).not.toBeInTheDocument();
});
