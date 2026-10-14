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
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const navigation = page.getByRole("navigation", { name: "Desktop folders" });
    for (const folder of shortcuts) {
      const shortcut = navigation.getByRole("button", { name: folder, exact: true });
      await expect(shortcut).toBeVisible();
      await shortcut.click();
      await expect(page.getByRole("dialog", { name: folder, exact: true })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(shortcut).toBeFocused();
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
