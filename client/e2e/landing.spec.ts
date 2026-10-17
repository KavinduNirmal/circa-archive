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

test("a Korean-preferring browser reaches the Korean portal without being asked", async ({ browser }) => {
  // Detection is on Accept-Language, so the browser's own locale is the input.
  const context = await browser.newContext({ locale: "ko-KR" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page).toHaveURL(/\/ko$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await expect(page.getByRole("link", { name: "기록보관소 열람" })).toHaveAttribute("href", "/ko/desktop");
  await context.close();
});

test("the language switcher changes language without losing the page", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/ko");
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");

  await page.getByRole("navigation", { name: "언어" }).getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("link", { name: "Enter the archive", exact: true })).toBeVisible();

  // The choice outranks the browser's preference next time, so it is remembered.
  const remembered = (await page.context().cookies()).find((item) => item.name === "NEXT_LOCALE");
  expect(remembered?.value).toBe("en");
});

test("the switcher keeps the reader on the workstation rather than sending them home", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en/desktop");
  await expect(page.getByRole("button", { name: "Start", exact: true })).toBeVisible();

  await page.getByRole("navigation", { name: "Language" }).getByRole("link", { name: "한국어" }).click();
  await expect(page).toHaveURL(/\/ko\/desktop$/);
  // The workstation's own chrome followed the language, not just the document.
  await expect(page.getByRole("button", { name: "시작", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "데스크톱 폴더" })).toBeVisible();
});
