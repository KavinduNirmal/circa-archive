import { expect, test } from "@playwright/test";

for (const width of [1440, 640, 390, 320]) {
  test(`public portal remains navigable at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page).toHaveTitle(/Public Registry/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const entry = page.getByRole("link", { name: "Enter the archive", exact: true });
    await expect(entry).toBeInViewport();
    await page.getByRole("link", { name: "AC–09 · Closure of a file" }).click();
    await expect(page.getByRole("heading", { name: "Document not supplied" })).toBeInViewport();
    const rules = page.getByText("Read the rules for submitted material · SP–02");
    await rules.press("Enter");
    await expect(page.getByText(/Submit original material/)).toBeVisible();
    await rules.press("Enter");
    await expect(page.getByText(/Submit original material/)).toBeHidden();
    await page.getByRole("link", { name: "Return to top ↑" }).click();
    await page.screenshot({ path: `/tmp/circa-portal-${width}.png`, fullPage: true });
    expect(errors).toEqual([]);
  });
}

test("skip navigation and archive entry work with a keyboard", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to public access" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Enter the archive", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/desktop$/);
  await expect(page.getByRole("navigation", { name: "Desktop folders" })).toBeVisible();
});

test("decorative movement is brief, finite, and absent under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const mark = page.getByText(/CHECKED.*04/);
  const animation = await mark.evaluate((node) => {
    const style = getComputedStyle(node);
    return { duration: style.animationDuration, delay: style.animationDelay, count: style.animationIterationCount };
  });
  expect(animation).toEqual({ duration: "0.08s", delay: "19s", count: "1" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(mark).toHaveCSS("animation-name", "none");
  await expect(page.getByLabel("Administrative stamp: continuation sheet 2 of 1")).not.toHaveCSS("transform", "none");
});
