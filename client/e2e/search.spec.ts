import { expect, test } from "@playwright/test";

test("search filters use the canonical address and sealed incidents stay stubs", async ({
  page,
}) => {
  await page.goto("/en/site/records");
  const form = page.getByRole("search").nth(1);
  await form.locator("summary").click();
  await form.getByRole("searchbox").fill("INC-00042");
  await form
    .locator("fieldset")
    .filter({ hasText: "Result type" })
    .getByRole("checkbox", { name: "Incident", exact: true })
    .check();
  await form
    .locator("fieldset")
    .filter({ hasText: "Status" })
    .getByRole("checkbox", { name: "Sealed", exact: true })
    .check();
  await form.getByRole("button", { name: "Search", exact: true }).click();

  await expect(page).toHaveURL(
    /\/en\/site\/records\?q=INC-00042&type=incident&status=sealed$/,
  );
  await expect(
    page.getByRole("link", { name: "Open INC-00042" }),
  ).toBeVisible();
  await expect(page.getByText(/acknowledge to reveal/)).toBeVisible();
  await expect(page.getByText(/Three separate climbs/)).toHaveCount(0);
});

test("pagination preserves page size and filters", async ({ page }) => {
  await page.goto("/en/site/records?warn=green&limit=10");
  await page.getByRole("link", { name: "2", exact: true }).click();
  await expect(page).toHaveURL(
    /\/en\/site\/records\?warn=green&page=2&limit=10$/,
  );
});

test("the global search form submits without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto("/en/site/records");
    const form = page.getByRole("search").nth(1);
    await form.locator("summary").click();
    await form.getByRole("searchbox").fill("INC-00042");
    await form
      .locator("fieldset")
      .filter({ hasText: "Result type" })
      .getByRole("checkbox", { name: "Incident", exact: true })
      .check();
    await form
      .locator("fieldset")
      .filter({ hasText: "Status" })
      .getByRole("checkbox", { name: "Sealed", exact: true })
      .check();
    await form.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page).toHaveURL(
      /\/en\/site\/records\?q=INC-00042&type=incident&status=sealed$/,
    );
    await expect(page.getByText(/acknowledge to reveal/)).toBeVisible();
  } finally {
    await context.close();
  }
});

test("warning tag exclusion persists and filters fit desktop and mobile", async ({
  page,
}) => {
  await page.goto("/en/site/records");
  const form = page.getByRole("search").nth(1);
  await form.locator("summary").click();
  const tag = form.getByRole("checkbox", { name: /Graphic violence/ });
  await tag.click();
  await expect(tag).toBeChecked();
  await tag.press("Space");
  await expect(tag).toHaveAttribute("aria-checked", "mixed");
  await form
    .getByRole("button", { name: "Apply filters", exact: true })
    .click();
  await expect(page).toHaveURL(/excludeWarnTag=graphic-violence/);
  await form.locator("summary").click();
  await expect(
    form.getByRole("checkbox", { name: /Graphic violence/ }),
  ).toHaveAttribute("aria-checked", "mixed");
  await page.screenshot({
    path: "/tmp/circa-search-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    form.getByRole("button", { name: "Apply filters", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "/tmp/circa-search-mobile.png",
    fullPage: true,
  });
});
