import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

/** Read the shipped catalog rather than hard-coding a translation that can drift. */
const koShell = JSON.parse(readFileSync("messages/ko/shell.json", "utf8")) as {
  readerTitle: string;
};

/**
 * Deep links and history for the workstation.
 *
 * The shell lives in a workspace layout, so every test here also proves that a
 * desktop URL keeps the shell mounted and does not replay the post screen. The
 * public `/{lang}/site/records/[code]` edition stays canonical; these URLs are
 * workspace positions and are marked noindex.
 */

const ARCHIVE = "Archive - CIRCA Explorer";
const BROWSER = "Titan Browser - CIRCA Archive";
const RECORD = "Record Viewer";

/** Any key hands the post screen over; if hydration is not ready, its timer does. */
async function enterWorkstation(page: Page, path: string) {
  const response = await page.goto(path);
  await page.keyboard.press("a");
  return response;
}

test("a destination deep link opens its window", async ({ page }) => {
  const response = await enterWorkstation(page, "/en/desktop/archive");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("dialog", { name: ARCHIVE })).toBeVisible();
  await expect(page).toHaveURL(/\/en\/desktop\/archive$/);
  // The URL was adopted, not navigated to; the page did not grow its history.
  await expect(
    page.getByRole("region", { name: "Workstation boot" }),
  ).toHaveCount(0);
});

test("a record deep link opens the reader on that record", async ({ page }) => {
  await enterWorkstation(page, "/en/desktop/record/INC-00014");
  const reader = page.getByRole("dialog", { name: RECORD });
  await expect(reader).toBeVisible();
  await expect(reader.getByRole("heading", { level: 1 })).toContainText(
    "Unlogged freight car, northbound",
  );
  await expect(page).toHaveURL(/\/en\/desktop\/record\/INC-00014$/);
});

test("an exploration code opens the reader at its own address", async ({
  page,
}) => {
  await enterWorkstation(page, "/en/desktop/record/EXP-288902");
  const reader = page.getByRole("dialog", { name: RECORD });
  await expect(reader).toBeVisible();
  await expect(reader.getByRole("heading", { level: 1 })).toContainText(
    "Second survey, landing nine",
  );
  expect(new URL(page.url()).pathname).toBe("/en/desktop/record/EXP-288902");
});

test("unknown destinations and codes are 404", async ({ page }) => {
  const destination = await page.goto("/en/desktop/nope");
  expect(destination?.status()).toBe(404);
  const record = await page.goto("/en/desktop/record/NOPE");
  expect(record?.status()).toBe(404);
});

test("opening a destination pushes and Back restores the previous URL", async ({
  page,
}) => {
  await enterWorkstation(page, "/en/desktop");
  const rail = page.getByRole("navigation", { name: "Desktop folders" });
  await rail.getByRole("button", { name: "Archive", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/desktop\/archive$/);

  await rail.getByRole("button", { name: "Inbox", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/desktop\/inbox$/);

  await page.goBack();
  await expect(page).toHaveURL(/\/en\/desktop\/archive$/);
  // The taskbar is a footer inside <main>, so it has no `contentinfo` role in
  // Playwright's tree; the element itself is the stable handle.
  const taskbar = page.locator("footer[aria-label='Taskbar']");
  // Archive is focused again, and Inbox is still open — Back moves focus, it
  // does not unwind the desktop.
  await expect(
    taskbar.getByRole("button", { name: ARCHIVE, exact: true }),
  ).toHaveAttribute("data-active", "true");
  await expect(
    taskbar.getByRole("button", { name: /Titan Mail/, exact: true }),
  ).toBeVisible();
  // An in-workspace navigation keeps the shell mounted: the post never replays.
  await expect(
    page.getByRole("region", { name: "Workstation boot" }),
  ).toHaveCount(0);

  await page.goForward();
  await expect(page).toHaveURL(/\/en\/desktop\/inbox$/);
  await expect(
    taskbar.getByRole("button", { name: /Titan Mail/, exact: true }),
  ).toHaveAttribute("data-active", "true");
});

test("Back and Forward move the reader cursor without appending to the trail", async ({
  page,
}) => {
  await enterWorkstation(page, "/en/desktop");
  await page
    .getByRole("navigation", { name: "Desktop folders" })
    .getByRole("button", { name: "Search", exact: true })
    .click();
  const browser = page.getByRole("dialog", { name: BROWSER });
  await browser.getByRole("button", { name: "INC-00907", exact: true }).click();
  const reader = page.getByRole("dialog", { name: RECORD });
  await expect(reader).toBeVisible();
  await expect(page).toHaveURL(/\/en\/desktop\/record\/INC-00907$/);

  // A follow-up opens the second record in the same viewer.
  const inbound = reader
    .getByRole("region", { name: "Subsequent Records" })
    .getByRole("list", { name: "Filed against this record" });
  await inbound.getByRole("button", { name: /INC-00027/ }).click();
  await expect(reader.getByRole("heading", { level: 1 })).toContainText(
    "Signal repeat interval",
  );
  await expect(page).toHaveURL(/\/en\/desktop\/record\/INC-00027$/);

  // Back is a cursor move inside the trail, not a new visit: Forward within the
  // viewer still reaches the record that was read after it.
  await page.goBack();
  await expect(page).toHaveURL(/\/en\/desktop\/record\/INC-00907$/);
  await expect(reader.getByRole("heading", { level: 1 })).toContainText(
    "Tide gauge disagreement, two stations",
  );
  const next = reader.getByRole("button", { name: "Next record", exact: true });
  await expect(next).toBeEnabled();
  await next.click();
  await expect(reader.getByRole("heading", { level: 1 })).toContainText(
    "Signal repeat interval",
  );
  // The reader's own Forward is a position change, so it replaces the address.
  await expect(page).toHaveURL(/\/en\/desktop\/record\/INC-00027$/);
});

test("closing and minimizing replace the URL with the surviving window", async ({
  page,
}) => {
  await enterWorkstation(page, "/en/desktop/archive");
  // Escape closes the focused window; with nothing left, the address is the bare workstation.
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: ARCHIVE })).toHaveCount(0);
  await expect(page).toHaveURL(/\/en\/desktop$/);

  await page
    .getByRole("navigation", { name: "Desktop folders" })
    .getByRole("button", { name: "Archive", exact: true })
    .click();
  await expect(page).toHaveURL(/\/en\/desktop\/archive$/);
  await page
    .getByRole("navigation", { name: "Desktop folders" })
    .getByRole("button", { name: "Inbox", exact: true })
    .click();
  await expect(page).toHaveURL(/\/en\/desktop\/inbox$/);

  await page
    .getByRole("button", { name: /Minimize Titan Mail/, exact: true })
    .click();
  await expect(page).toHaveURL(/\/en\/desktop\/archive$/);
});

test("the workstation addresses are noindex and the Korean route is Korean", async ({
  page,
}) => {
  await enterWorkstation(page, "/en/desktop/archive");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );

  await enterWorkstation(page, "/ko/desktop/record/INC-00014");
  const reader = page.getByRole("dialog", { name: koShell.readerTitle });
  await expect(reader).toBeVisible();
  // Filed content stays as filed; only the chrome follows the reader's language.
  await expect(reader.getByRole("heading", { level: 1 })).toContainText(
    "Unlogged freight car, northbound",
  );
});

test("a refresh restores the workspace and focuses the URL's window", async ({
  page,
}) => {
  await enterWorkstation(page, "/en/desktop");
  const rail = page.getByRole("navigation", { name: "Desktop folders" });
  await rail.getByRole("button", { name: "Archive", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/desktop\/archive$/);
  await rail.getByRole("button", { name: "Inbox", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/desktop\/inbox$/);

  await page.reload();
  await page.keyboard.press("a");

  // Both frames come back from the tab's session storage, and the address,
  // which names Inbox, is what holds focus.
  await expect(page.getByRole("dialog", { name: ARCHIVE })).toBeVisible();
  await expect(page.getByRole("dialog", { name: /Titan Mail/ })).toBeVisible();
  const taskbar = page.locator("footer[aria-label='Taskbar']");
  await expect(
    taskbar.getByRole("button", { name: /Titan Mail/, exact: true }),
  ).toHaveAttribute("data-active", "true");
});

test("a new tab starts with an empty workspace", async ({ page, context }) => {
  await enterWorkstation(page, "/en/desktop");
  await page
    .getByRole("navigation", { name: "Desktop folders" })
    .getByRole("button", { name: "Archive", exact: true })
    .click();
  await expect(page.getByRole("dialog", { name: ARCHIVE })).toBeVisible();

  // sessionStorage is per tab: a second tab is a second workspace, not a copy.
  const second = await context.newPage();
  try {
    await enterWorkstation(second, "/en/desktop");
    await expect(second.getByRole("dialog")).toHaveCount(0);
  } finally {
    await second.close();
  }
});
