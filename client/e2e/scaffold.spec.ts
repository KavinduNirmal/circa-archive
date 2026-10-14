import { expect, test } from "@playwright/test";

/** Desktop shortcuts in reading order, matching `desktopFolders`. */
const shortcuts = ["My PC", "My Documents", "Archive", "Organizations", "Inbox", "CIRCA Word", "Search", "_EXPUNGED", "Recycle Bin"];

/** Destinations that carry a retro shortcut marker. */
const shortcutMarked = ["Archive", "_EXPUNGED"];

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 640, height: 512 }]) {
  test(`desktop navigation at ${viewport.width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize(viewport);
    await page.goto("/desktop");
    await expect(page).toHaveTitle("CIRCA Archive");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole("main", { name: "CIRCA desktop" })).toBeVisible();
    const header = page.getByRole("banner", { name: "Workstation status" });
    await expect(header.getByText("SIMULATED LINK")).toBeVisible();
    await expect(header.getByText("10.42.0.19")).toBeVisible();
    expect((await header.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(40);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const navigation = page.getByRole("navigation", { name: "Desktop folders" });
    for (const folder of shortcuts) {
      const shortcut = navigation.getByRole("button", { name: folder, exact: true });
      await expect(shortcut).toBeVisible();
      await shortcut.click();
      const windowFrame = page.getByRole("dialog", { name: folder, exact: true });
      await expect(windowFrame).toBeVisible();
      // Escape closes the focused window; focus restoration is covered by the close-button test.
      await page.keyboard.press("Escape");
      await expect(windowFrame).toHaveCount(0);
    }
    expect(await navigation.locator('[data-icon="network"]').count()).toBe(1);
    expect(await navigation.locator('[data-icon="inbox"]').count()).toBe(1);
    expect(await navigation.locator('[data-icon="circa-word"]').count()).toBe(1);
    for (const folder of shortcutMarked) {
      await expect(navigation.getByRole("button", { name: folder, exact: true }).locator("[data-shortcut]")).toHaveCount(1);
    }
    expect(await navigation.locator("[data-shortcut]").count()).toBe(shortcutMarked.length);
    await page.getByRole("button", { name: "Start", exact: true }).click();
    await page.getByRole("navigation", { name: "Start applications" }).getByRole("button", { name: "Archive", exact: true }).click();
    await page.getByRole("button", { name: "Return to desktop" }).click();
    await expect(page.getByRole("button", { name: "Start", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "Notifications", exact: true }).click();
    await expect(page.getByText("Notifications are not connected yet.")).toBeVisible();
    await page.keyboard.press("Escape");
    const settings = page.getByRole("button", { name: "Settings", exact: true });
    await expect(settings).toHaveClass(/taskbar-task/);
    await settings.click();
    await page.getByRole("checkbox", { name: "CRT screen filter" }).click();
    await expect(page.getByTestId("screen-filter")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await navigation.getByRole("button", { name: "Archive", exact: true }).focus();
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "Close folder" }).click();
    await page.screenshot({ path: `/tmp/circa-desktop-${viewport.width}.png` });
    expect(errors).toEqual([]);
  });
}

test("desktop shortcuts explain themselves with the beveled tooltip", async ({ page }) => {
  await page.goto("/desktop");
  const organizations = page.getByRole("navigation", { name: "Desktop folders" }).getByRole("button", { name: "Organizations", exact: true });
  await expect(organizations).not.toHaveAttribute("title", /.+/);
  await organizations.hover();
  const tooltip = page.getByRole("tooltip");
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText("Organization dossiers and continuities");
  await expect(tooltip.locator(".tooltip-arrow-fill")).toBeVisible();
  await page.mouse.move(720, 500);
  await expect(tooltip).toBeHidden();
});

test("windows drag, resize, minimize, and maximize", async ({ page }) => {
  await page.goto("/desktop");
  const shortcut = page.getByRole("navigation", { name: "Desktop folders" }).getByRole("button", { name: "Archive", exact: true });
  await shortcut.click();
  const windowFrame = page.getByRole("dialog", { name: "Archive", exact: true });
  await expect(windowFrame).toBeVisible();

  // A frame that is not absolutely positioned flows into a vertical stack.
  expect(await windowFrame.evaluate((node) => getComputedStyle(node).position)).toBe("absolute");
  const start = (await windowFrame.boundingBox())!;
  const titlebar = page.getByTestId("window-titlebar-archive");
  const bar = (await titlebar.boundingBox())!;
  await page.mouse.move(bar.x + bar.width / 2, bar.y + bar.height / 2);
  await page.mouse.down();
  await page.mouse.move(bar.x + bar.width / 2 + 120, bar.y + bar.height / 2 + 60, { steps: 8 });
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
  const handle = (await resizeHandle.boundingBox())!;
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2 + 90, handle.y + handle.height / 2 + 60, { steps: 8 });
  await page.mouse.up();
  const resized = (await windowFrame.boundingBox())!;
  expect(Math.round(resized.width - moved.width)).toBe(90);
  expect(Math.round(resized.height - moved.height)).toBe(60);

  await page.getByRole("button", { name: "Maximize Archive", exact: true }).click();
  await expect(windowFrame).toHaveAttribute("data-maximized", "true");
  // A maximized window fills the desktop layer exactly, never overflowing it.
  const maximized = (await windowFrame.boundingBox())!;
  const layer = (await page.locator(".desktop-area").boundingBox())!;
  expect(Math.round(maximized.width)).toBe(Math.round(layer.width));
  expect(Math.round(maximized.height)).toBe(Math.round(layer.height));
  expect(Math.round(maximized.x)).toBe(Math.round(layer.x));
  expect(Math.round(maximized.y)).toBe(Math.round(layer.y));
  await page.getByRole("button", { name: "Restore Archive", exact: true }).click();
  await expect(windowFrame).not.toHaveAttribute("data-maximized");
  expect(Math.round((await windowFrame.boundingBox())!.width)).toBe(Math.round(resized.width));

  await page.getByRole("button", { name: "Minimize Archive", exact: true }).click();
  await expect(windowFrame).toHaveCount(0);
  const taskEntry = page.getByRole("contentinfo", { name: "Taskbar" }).getByRole("button", { name: "Archive", exact: true });
  await taskEntry.click();
  await expect(page.getByRole("dialog", { name: "Archive", exact: true })).toBeVisible();
  await expect(taskEntry).toHaveAttribute("aria-pressed", "false");
});

test("My PC contains System and back-tracks", async ({ page }) => {
  await page.goto("/desktop");
  await page.getByRole("button", { name: "My PC", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "My PC", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "System", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "System", exact: true })).toBeVisible();
  await expect(page.getByText("DESKTOP / MY PC / SYSTEM")).toBeVisible();
  await page.getByRole("button", { name: "Back to My PC" }).click();
  await expect(page.getByRole("dialog", { name: "My PC", exact: true })).toBeVisible();
});

test("home mounts the same desktop", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Desktop folders" })).toBeVisible();
});
