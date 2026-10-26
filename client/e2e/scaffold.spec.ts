import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

/** Read the shipped copy so a rewrite of the tooltip does not fail this spec. */
const shell = JSON.parse(readFileSync("messages/en/shell.json", "utf8")) as {
  organizationsDetail: string;
};

/**
 * Desktop shortcuts in reading order, each paired with the title its window takes.
 *
 * A folder window is named for the folder plus the explorer, and the three
 * applications name their own windows, so the shortcut label and the dialog title
 * are not the same string.
 */
const shortcuts = [
  ["My PC", "My Computer - CIRCA Explorer"],
  ["My Documents", "My Documents - CIRCA Explorer"],
  ["My Work", "My Work - CIRCA Explorer"],
  ["Archive", "Archive - CIRCA Explorer"],
  ["Organizations", "Organizations - CIRCA Explorer"],
  ["Inbox", "Titan Mail - CIRCA Correspondence"],
  ["CIRCA Word", "CIRCA Word - Untitled Record"],
  ["Search", "Titan Browser - CIRCA Archive"],
  ["_EXPUNGED", "_EXPUNGED - CIRCA Explorer"],
  ["Recycle Bin", "Recycle Bin - CIRCA Explorer"],
] as const;

/** The archive explorer's window, which several gestures below act on. */
const ARCHIVE_WINDOW = "Archive - CIRCA Explorer";

/** Destinations that carry a retro shortcut marker. */
const shortcutMarked = ["Archive", "_EXPUNGED"];

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
  { width: 640, height: 512 },
]) {
  test(`desktop navigation at ${viewport.width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize(viewport);
    await page.goto("/desktop");
    // The workstation page's own title, which the root layout's default does not override.
    await expect(page).toHaveTitle("Workstation");
    await page.evaluate(() => document.fonts.ready);
    await expect(
      page.getByRole("main", { name: "CIRCA desktop" }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Cookie notice" }),
    ).toBeVisible();
    // The notice, taskbar, and usable canvas must occupy separate vertical space.
    await expect
      .poll(() =>
        page.evaluate(() => {
          const area = document
            .querySelector(".desktop-area")!
            .getBoundingClientRect();
          const taskbar = document
            .querySelector(".desktop-taskbar")!
            .getBoundingClientRect();
          return Math.round(area.bottom - taskbar.top);
        }),
      )
      .toBe(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    const navigation = page.getByRole("navigation", {
      name: "Desktop folders",
    });
    for (const [folder, windowTitle] of shortcuts) {
      const shortcut = navigation.getByRole("button", {
        name: folder,
        exact: true,
      });
      await expect(shortcut).toBeVisible();
      await shortcut.click();
      const windowFrame = page.getByRole("dialog", {
        name: windowTitle,
        exact: true,
      });
      await expect(windowFrame).toBeVisible();
      // Escape closes the focused window; focus restoration is covered by the close-button test.
      await page.keyboard.press("Escape");
      await expect(windowFrame).toHaveCount(0);
    }
    expect(
      await navigation.locator('[data-icon="organizations"]').count(),
    ).toBe(1);
    expect(await navigation.locator('[data-icon="inbox"]').count()).toBe(1);
    expect(await navigation.locator('[data-icon="circa-word"]').count()).toBe(
      1,
    );
    for (const folder of shortcutMarked) {
      await expect(
        navigation
          .getByRole("button", { name: folder, exact: true })
          .locator("[data-shortcut]"),
      ).toHaveCount(1);
    }
    expect(await navigation.locator("[data-shortcut]").count()).toBe(
      shortcutMarked.length,
    );
    await page.getByRole("button", { name: "Start", exact: true }).click();
    await page
      .getByRole("navigation", { name: "Start applications" })
      .getByRole("button", { name: "Archive", exact: true })
      .click();
    await page
      .getByRole("button", { name: `Close ${ARCHIVE_WINDOW}`, exact: true })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(navigation).toBeVisible();
    await page
      .getByRole("button", { name: "Notifications", exact: true })
      .click();
    await expect(
      page.getByText("Notifications are not connected yet."),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    const settings = page.getByRole("button", {
      name: "Settings",
      exact: true,
    });
    await expect(settings).toHaveClass(/taskbar-task/);
    await settings.click();
    await page.getByRole("checkbox", { name: "CRT screen filter" }).click();
    await expect(page.getByTestId("screen-filter")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await navigation
      .getByRole("button", { name: "Archive", exact: true })
      .focus();
    await page.keyboard.press("Enter");
    await page
      .getByRole("button", { name: `Close ${ARCHIVE_WINDOW}`, exact: true })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.screenshot({ path: `/tmp/circa-desktop-${viewport.width}.png` });
    expect(errors).toEqual([]);
  });
}

test("desktop shortcuts explain themselves with the beveled tooltip", async ({
  page,
}) => {
  await page.goto("/desktop");
  const organizations = page
    .getByRole("navigation", { name: "Desktop folders" })
    .getByRole("button", { name: "Organizations", exact: true });
  await expect(organizations).not.toHaveAttribute("title", /.+/);
  await organizations.hover();
  const tooltip = page.getByRole("tooltip");
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText(shell.organizationsDetail);
  await expect(tooltip.locator(".tooltip-arrow")).toHaveCount(1);
  await page.mouse.move(5, 5);
  await expect(tooltip).toBeHidden();
});

test("windows drag, resize, minimize, and maximize", async ({ page }) => {
  // Leave room for the full drag and resize even while the cookie notice is open.
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/desktop");
  const shortcut = page
    .getByRole("navigation", { name: "Desktop folders" })
    .getByRole("button", { name: "Archive", exact: true });
  await shortcut.click();
  const windowFrame = page.getByRole("dialog", {
    name: ARCHIVE_WINDOW,
    exact: true,
  });
  await expect(windowFrame).toBeVisible();

  // A frame that is not absolutely positioned flows into a vertical stack.
  expect(
    await windowFrame.evaluate((node) => getComputedStyle(node).position),
  ).toBe("absolute");
  const start = (await windowFrame.boundingBox())!;
  const titlebar = page.getByTestId("window-titlebar-archive");
  const bar = (await titlebar.boundingBox())!;
  await page.mouse.move(bar.x + bar.width / 2, bar.y + bar.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    bar.x + bar.width / 2 + 120,
    bar.y + bar.height / 2 + 60,
    { steps: 8 },
  );
  await page.mouse.up();
  const moved = (await windowFrame.boundingBox())!;
  // The drop must land exactly where the pointer released it.
  expect(Math.round(moved.x - start.x)).toBe(120);
  expect(Math.round(moved.y - start.y)).toBe(60);
  await page.waitForTimeout(150);
  const settled = (await windowFrame.boundingBox())!;
  expect(Math.round(settled.x)).toBe(Math.round(moved.x));
  expect(Math.round(settled.y)).toBe(Math.round(moved.y));

  const resizeHandle = windowFrame.locator(".workstation-window-resize");
  const canvas = (await page.locator(".desktop-area").boundingBox())!;
  expect(
    canvas.x + canvas.width - moved.x - moved.width,
  ).toBeGreaterThanOrEqual(90);
  expect(
    canvas.y + canvas.height - moved.y - moved.height,
  ).toBeGreaterThanOrEqual(60);
  const handle = (await resizeHandle.boundingBox())!;
  await page.mouse.move(
    handle.x + handle.width / 2,
    handle.y + handle.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    handle.x + handle.width / 2 + 90,
    handle.y + handle.height / 2 + 60,
    { steps: 8 },
  );
  await page.mouse.up();
  const resized = (await windowFrame.boundingBox())!;
  expect(Math.round(resized.width - moved.width)).toBe(90);
  expect(Math.round(resized.height - moved.height)).toBe(60);

  await page
    .getByRole("button", { name: `Maximize ${ARCHIVE_WINDOW}`, exact: true })
    .click();
  await expect(windowFrame).toHaveAttribute("data-maximized", "true");
  // A maximized window fills the desktop layer exactly, never overflowing it.
  const maximized = (await windowFrame.boundingBox())!;
  const layer = (await page.locator(".desktop-area").boundingBox())!;
  expect(Math.round(maximized.width)).toBe(Math.round(layer.width));
  expect(Math.round(maximized.height)).toBe(Math.round(layer.height));
  expect(Math.round(maximized.x)).toBe(Math.round(layer.x));
  expect(Math.round(maximized.y)).toBe(Math.round(layer.y));
  await page
    .getByRole("button", { name: `Restore ${ARCHIVE_WINDOW}`, exact: true })
    .click();
  await expect(windowFrame).not.toHaveAttribute("data-maximized");
  expect(Math.round((await windowFrame.boundingBox())!.width)).toBe(
    Math.round(resized.width),
  );

  await page
    .getByRole("button", { name: `Minimize ${ARCHIVE_WINDOW}`, exact: true })
    .click();
  await expect(windowFrame).toHaveCount(0);
  const taskEntry = page
    .locator("footer[aria-label='Taskbar']")
    .getByRole("button", { name: ARCHIVE_WINDOW, exact: true });
  await taskEntry.click();
  await expect(
    page.getByRole("dialog", { name: ARCHIVE_WINDOW, exact: true }),
  ).toBeVisible();
  await expect(taskEntry).toHaveAttribute("aria-pressed", "false");
});

test("the canvas and maximized window follow cookie notice expansion and dismissal", async ({
  page,
}) => {
  await page.setViewportSize({ width: 640, height: 700 });
  await page.goto("/desktop");
  const notice = page.getByRole("region", { name: "Cookie notice" });
  await expect(notice).toBeVisible();
  await page
    .getByRole("navigation", { name: "Desktop folders" })
    .getByRole("button", { name: "Archive", exact: true })
    .click();
  const frame = page.getByRole("dialog", { name: ARCHIVE_WINDOW, exact: true });
  await page
    .getByRole("button", { name: `Maximize ${ARCHIVE_WINDOW}`, exact: true })
    .click();
  const area = page.locator(".desktop-area");
  const originalHeight = (await area.boundingBox())!.height;
  await notice.getByText("Cookie details", { exact: true }).click();
  await expect
    .poll(async () => (await area.boundingBox())!.height)
    .toBeLessThan(originalHeight);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const canvas = document
          .querySelector(".desktop-area")!
          .getBoundingClientRect();
        const taskbar = document
          .querySelector(".desktop-taskbar")!
          .getBoundingClientRect();
        return Math.round(canvas.bottom - taskbar.top);
      }),
    )
    .toBe(0);
  await expect
    .poll(async () =>
      Math.round(
        (await frame.boundingBox())!.height -
          (await area.boundingBox())!.height,
      ),
    )
    .toBe(0);
  await notice.getByRole("button", { name: "Understood", exact: true }).click();
  await expect(notice).toHaveCount(0);
  await expect.poll(async () => (await area.boundingBox())!.height).toBe(660);
  await expect
    .poll(async () =>
      Math.round(
        (await frame.boundingBox())!.height -
          (await area.boundingBox())!.height,
      ),
    )
    .toBe(0);
});

test("My PC contains System and back-tracks", async ({ page }) => {
  await page.goto("/desktop");
  await page.getByRole("button", { name: "My PC", exact: true }).click();
  // The workstation root is a computer, so the explorer titles it as one.
  const frame = page.getByRole("dialog", {
    name: "My Computer - CIRCA Explorer",
    exact: true,
  });
  await expect(frame).toBeVisible();
  // System lives inside My PC, as a folder in the tree.
  const tree = frame.getByRole("tree", { name: "Folders" });
  const systemFiles = tree.getByRole("button", { name: /^System Files/ });
  await expect(systemFiles).toBeVisible();
  await systemFiles.click();
  // The window keeps the title it opened with; the address field reports where it now is.
  await expect(frame).toBeVisible();
  await expect(frame.getByText("CIRCA_OS_MANUAL.pdf")).toBeVisible();
  await expect(frame.getByLabel("Current path")).toHaveValue(
    "My Computer\\C: [SYSTEM]\\System Files",
  );
});

test("home leads to the desktop", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: "Enter the archive", exact: true })
    .click();
  await expect(
    page.getByRole("navigation", { name: "Desktop folders" }),
  ).toBeVisible();
});
