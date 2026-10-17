import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DesktopShell } from "@/components/desktop-shell";
import { catalogFor, renderWithIntl } from "./intl";

/**
 * The shell was localized first and the application windows after it, so this is
 * the test that says the second pass actually happened: each window is opened in
 * Korean and asked for a word from its own catalog.
 *
 * Assertions name the English wording and resolve the Korean from the shipped
 * catalog, so a test cannot pass by hard-coding a translation that then drifts
 * away from the one the app renders.
 */
function koreanFor(namespace: string, english: string): string {
  const englishCatalog = catalogFor("en")[namespace];
  const koreanCatalog = catalogFor("ko")[namespace];
  const key = Object.keys(englishCatalog).find((candidate) => englishCatalog[candidate] === english);
  if (!key) throw new Error(`no ${namespace} message reads "${english}"`);
  return koreanCatalog[key];
}

/** A translated string that is genuinely translated, not a stub the two catalogs share. */
function translatedFor(namespace: string, english: string): string {
  const korean = koreanFor(namespace, english);
  expect(korean, `${namespace}: "${english}" is identical in both catalogs`).not.toBe(english);
  return korean;
}

const shell = catalogFor("ko").shell;

describe("every application window speaks the reader's language", () => {
  it("opens the file browser with Korean chrome", async () => {
    const user = userEvent.setup();
    renderWithIntl(<DesktopShell />, { locale: "ko" });
    await user.click(screen.getByRole("button", { name: shell.archiveLabel }));

    const frame = screen.getByRole("dialog", { name: `${shell.archiveLabel} - ${shell.explorerSuffix}` });
    expect(frame).toHaveTextContent(translatedFor("files", "File"));
    expect(frame).toHaveTextContent(translatedFor("files", "Edit"));
  });

  it("opens the mail client with Korean chrome, folders and all", async () => {
    const user = userEvent.setup();
    renderWithIntl(<DesktopShell />, { locale: "ko" });
    await user.click(screen.getByRole("button", { name: shell.inboxLabel }));

    const frame = screen.getByRole("dialog", { name: shell.mailTitle });
    expect(frame).toHaveTextContent(translatedFor("mail", "File"));
    // The folder list is the clearest sign the window itself translated: these
    // names are chrome, read from the catalog rather than from the store. The
    // button announces its unread count too, so only the name is matched.
    const inbox = translatedFor("mail", "Inbox");
    expect(within(frame).getByRole("button", { name: new RegExp(`^${inbox}`) })).toBeVisible();
  });

  it("opens the record editor with Korean chrome", async () => {
    const user = userEvent.setup();
    renderWithIntl(<DesktopShell />, { locale: "ko" });
    await user.click(screen.getByRole("button", { name: shell.wordLabel }));

    const frame = screen.getByRole("dialog", { name: shell.wordTitle });
    expect(frame).toHaveTextContent(translatedFor("word", "File"));
    expect(frame).toHaveTextContent(translatedFor("word", "View"));
  });

  it("opens the archive browser with Korean chrome", async () => {
    const user = userEvent.setup();
    renderWithIntl(<DesktopShell />, { locale: "ko" });
    await user.click(screen.getByRole("button", { name: shell.searchLabel }));

    const frame = screen.getByRole("dialog", { name: shell.browserTitle });
    expect(frame).toHaveTextContent(translatedFor("browser", "File"));
    expect(within(frame).getByRole("button", { name: translatedFor("browser", "Search archive") })).toBeVisible();
  });

  it("opens the record reader with the reviewer's own Korean vocabulary", async () => {
    const user = userEvent.setup();
    renderWithIntl(<DesktopShell />, { locale: "ko" });
    await user.click(screen.getByRole("button", { name: shell.searchLabel }));
    const browser = screen.getByRole("dialog", { name: shell.browserTitle });
    await user.click(within(browser).getByRole("button", { name: "INC-00907" }));

    const reader = screen.getByRole("dialog", { name: shell.readerTitle });
    // The vocabulary is the part of this app that must not be flattened, so the
    // test asks for the specific words rather than for "some Korean".
    expect(reader).toHaveTextContent(translatedFor("reader", "Annotations"));
    expect(reader).toHaveTextContent(translatedFor("reader", "Corroborate"));
    expect(reader).toHaveTextContent(translatedFor("reader", "Contest"));
  });
});
