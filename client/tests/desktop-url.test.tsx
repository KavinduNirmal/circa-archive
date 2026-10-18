import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DesktopShell } from "@/components/desktop-shell";
import { DesktopUrlSync } from "@/components/desktop-url-sync";
import { createWorkstationStore } from "@/stores/workstation-store";
import { catalogFor, renderWorkstation } from "./intl";

/**
 * The address bar is a second view of the desktop, so these tests drive the
 * shell and the URL adapter together and assert the history policy exactly:
 * opening a document pushes, a focus change replaces, and adopting a URL writes
 * nothing.
 *
 * The navigation module is mocked because there is no router under jsdom. The
 * mock keeps one mutable pathname: a test applies a written URL with `go()`,
 * which is what the real router would do after push/replace.
 */
const nav = vi.hoisted(() => ({
  pathname: "/desktop",
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: nav.push, replace: nav.replace }),
  Link: () => null,
}));

const shell = catalogFor("en").shell;
const ARCHIVE = `${shell.archiveLabel} - ${shell.explorerSuffix}`;
const MAIL = shell.mailTitle;
const RECORD = shell.readerTitle;

function harness(initial = "/desktop") {
  nav.pathname = initial;
  nav.push.mockClear();
  nav.replace.mockClear();
  const store = createWorkstationStore();
  // A fresh element per render: React may bail out of re-rendering an identical
  // tree, and the pathname change only reaches the effect through a render.
  const renderSubject = () => <><DesktopShell /><DesktopUrlSync /></>;
  const rendered = renderWorkstation(renderSubject(), { store });
  /** Applies a written URL the way the router would, without remounting the shell. */
  const go = (path: string) => {
    nav.pathname = path;
    rendered.rerender(renderSubject());
  };
  return { ...rendered, store, go };
}

const rail = () => within(screen.getByRole("navigation", { name: shell.foldersLabel }));
const taskbar = () => within(screen.getByRole("contentinfo", { name: shell.taskbarLabel }));

beforeEach(() => {
  nav.pathname = "/desktop";
  nav.push.mockClear();
  nav.replace.mockClear();
});

describe("URL to workstation", () => {
  it("opens the destination a deep link names, without writing the URL back", () => {
    const { store } = harness("/desktop/archive");
    expect(screen.getByRole("dialog", { name: ARCHIVE })).toBeVisible();
    expect(store.getState().lastFocused).toBe("archive");
    // Adopting the address is not a navigation; it must not grow history.
    expect(nav.push).not.toHaveBeenCalled();
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("opens the reader on the record a deep link names", () => {
    const { store } = harness("/desktop/record/INC-00014");
    const reader = screen.getByRole("dialog", { name: RECORD });
    expect(within(reader).getByRole("heading", { level: 1 })).toHaveTextContent("Unlogged freight car, northbound");
    expect(store.getState().readerTrail).toEqual({ codes: ["INC-00014"], at: 0 });
    expect(nav.push).not.toHaveBeenCalled();
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("moves the reader cursor for a record URL instead of appending a visit", () => {
    const { store, go } = harness("/desktop");
    const user = userEvent.setup();
    return (async () => {
      await user.click(rail().getByRole("button", { name: shell.searchLabel }));
      go("/desktop/search");
      await user.click(within(screen.getByRole("dialog", { name: shell.browserTitle })).getByRole("button", { name: "INC-00907" }));
      go("/desktop/record/INC-00907");
      expect(store.getState().readerTrail.codes).toEqual(["INC-00907"]);

      // Back to the bare search destination: the reader stays open, unfocused.
      go("/desktop/search");
      expect(screen.getByRole("dialog", { name: shell.browserTitle })).toBeVisible();

      // Forward to the record again: the cursor returns, the trail does not grow.
      go("/desktop/record/INC-00907");
      expect(store.getState().readerTrail).toEqual({ codes: ["INC-00907"], at: 0 });
      expect(store.getState().lastFocused).toBe("reader");
    })();
  });
});

describe("workstation to URL", () => {
  it("pushes a destination opened from the rail, then settles", async () => {
    const { store, go } = harness();
    const user = userEvent.setup();
    await user.click(rail().getByRole("button", { name: shell.archiveLabel }));
    expect(nav.push).toHaveBeenCalledWith("/desktop/archive");
    expect(nav.replace).not.toHaveBeenCalled();
    // The intent is one-shot: the write consumes it.
    expect(store.getState().historyIntent).toBeNull();

    go("/desktop/archive");
    expect(nav.push).toHaveBeenCalledTimes(1);
    expect(store.getState().historyIntent).toBeNull();
  });

  it("pushes a record opened from the browser, with its code in the URL", async () => {
    const { go } = harness("/desktop/search");
    const user = userEvent.setup();
    await user.click(within(screen.getByRole("dialog", { name: shell.browserTitle })).getByRole("button", { name: "INC-00907" }));
    expect(nav.push).toHaveBeenCalledWith("/desktop/record/INC-00907");
    go("/desktop/record/INC-00907");
    expect(nav.push).toHaveBeenCalledTimes(1);
  });

  it("does not resurrect a window closed before its push landed", async () => {
    const { store, go } = harness();
    const user = userEvent.setup();
    await user.click(rail().getByRole("button", { name: shell.archiveLabel }));
    expect(nav.push).toHaveBeenCalledWith("/desktop/archive");

    // A push is asynchronous, and an operator can close the frame before the
    // address arrives. The close must win: the landing address is corrected
    // rather than adopted as a fresh deep link.
    await user.click(screen.getByRole("button", { name: `Close ${ARCHIVE}` }));
    expect(store.getState().windows).toEqual([]);

    go("/desktop/archive");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(nav.replace).toHaveBeenCalledWith("/desktop");
  });

  it("replaces on taskbar focus instead of pushing a new entry", async () => {
    const { go } = harness();
    const user = userEvent.setup();
    await user.click(rail().getByRole("button", { name: shell.archiveLabel }));
    go("/desktop/archive");
    await user.click(rail().getByRole("button", { name: shell.inboxLabel }));
    go("/desktop/inbox");
    nav.push.mockClear();

    await user.click(taskbar().getByRole("button", { name: ARCHIVE }));
    expect(nav.replace).toHaveBeenCalledWith("/desktop/archive");
    expect(nav.push).not.toHaveBeenCalled();
  });

  it("replaces to the surviving window when the focused one minimizes", async () => {
    const { go } = harness();
    const user = userEvent.setup();
    await user.click(rail().getByRole("button", { name: shell.archiveLabel }));
    go("/desktop/archive");
    await user.click(rail().getByRole("button", { name: shell.inboxLabel }));
    go("/desktop/inbox");
    nav.replace.mockClear();

    await user.click(screen.getByRole("button", { name: `Minimize ${MAIL}` }));
    expect(nav.replace).toHaveBeenCalledWith("/desktop/archive");
  });

  it("replaces to the bare workstation when the last window closes", async () => {
    const { go } = harness("/desktop/archive");
    const user = userEvent.setup();
    nav.replace.mockClear();
    await user.click(screen.getByRole("button", { name: `Close ${ARCHIVE}` }));
    expect(nav.replace).toHaveBeenCalledWith("/desktop");
    go("/desktop");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("replaces when the reader's own Back moves the displayed record", async () => {
    const { store, go } = harness("/desktop");
    const user = userEvent.setup();
    await user.click(rail().getByRole("button", { name: shell.searchLabel }));
    go("/desktop/search");
    const browser = within(screen.getByRole("dialog", { name: shell.browserTitle }));
    await user.click(browser.getByRole("button", { name: "INC-00907" }));
    go("/desktop/record/INC-00907");
    const reader = screen.getByRole("dialog", { name: RECORD });
    // A follow-up opens a second record in the same viewer.
    const strip = within(reader).getByRole("region", { name: /Subsequent Records/i });
    const inbound = within(strip).getByRole("list", { name: /Filed against this record/i });
    await user.click(within(inbound).getByRole("button", { name: /INC-00027/ }));
    go("/desktop/record/INC-00027");
    expect(store.getState().readerTrail).toEqual({ codes: ["INC-00907", "INC-00027"], at: 1 });
    nav.replace.mockClear();
    nav.push.mockClear();

    // The reader's own Back is a position change inside one document window, so
    // it replaces the address rather than growing history.
    await user.click(within(reader).getByRole("button", { name: /previous record/i }));
    expect(nav.replace).toHaveBeenCalledWith("/desktop/record/INC-00907");
    expect(nav.push).not.toHaveBeenCalled();
  });
});
