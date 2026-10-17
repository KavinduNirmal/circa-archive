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

test("a sentence changes for a moment and is put back", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const printed = "If a record names you in error, retain the reference number. Do not submit a second name.";
  const altered = "If a record names you, forget the reference number. Do not submit a second name.";
  await expect(page.getByText(printed)).toBeVisible();
  // The notice's first cue is six seconds in and it is held for under a second,
  // so the assertion polls quickly; a miss would mean the schedules drifted apart.
  await expect(page.getByText(altered)).toBeVisible({ timeout: 9000 });
  await expect(page.getByText(printed)).toBeVisible({ timeout: 5000 });
});

test("reduced motion stops the sentences changing but keeps the paperwork askew", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.waitForTimeout(8000);
  await expect(page.getByText(/If a record names you, forget/)).toHaveCount(0);
  await expect(page.getByText(/in error, retain the reference number/)).toBeVisible();
  // The stamp is a static tilt, not movement, so it survives the preference.
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
