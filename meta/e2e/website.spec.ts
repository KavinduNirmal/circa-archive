import { test, expect } from "@playwright/test";

test("the navigation exposes the requested chapters, About pages and archive entrances", async ({
  page,
}) => {
  await page.goto("/en/");
  const nav = page.getByRole("navigation", {
    name: "Project navigation",
    exact: true,
  });
  await expect(
    nav.getByRole("link", { name: "Home", exact: true }),
  ).toHaveAttribute("href", "/en/");
  await nav
    .locator("summary")
    .filter({ hasText: /^Documentation/ })
    .click();
  for (const name of ["Overview", "Lore", "Contribution", "Building"])
    await expect(
      nav.getByRole("link", { name: new RegExp(name) }),
    ).toBeVisible();
  await nav
    .locator("summary")
    .filter({ hasText: /^About/ })
    .click();
  for (const name of [
    "About the project",
    "About the team",
    "Terms of service",
  ])
    await expect(
      nav.getByRole("link", { name: new RegExp(name) }),
    ).toBeVisible();
  await page.keyboard.press("Escape");
  await nav
    .locator("summary")
    .filter({ hasText: /^Enter the archive/ })
    .click();
  await expect(
    nav.getByRole("link", { name: /Public archive/ }),
  ).toHaveAttribute("href", "http://localhost:3001/en/site");
  await expect(nav.getByRole("link", { name: /Workstation/ })).toHaveAttribute(
    "href",
    "http://localhost:3001/en/desktop",
  );
  await page.goto("/en/sponsor/");
  await expect(
    page.getByRole("link", { name: /Sponsor on GitHub/ }),
  ).toHaveAttribute("href", "https://github.com/sponsors/KavinduNirmal");
});

test("documentation chapters collapse, survive navigation and restore after search", async ({
  page,
}) => {
  await page.goto("/en/documentation/");
  const lore = page.locator('[data-chapter="lore"]');
  await expect(lore).not.toHaveAttribute("open", "");
  await lore.locator("summary").click();
  await expect(lore).toHaveAttribute("open", "");
  await lore.getByRole("link", { name: "Anatomy", exact: true }).click();
  await expect(lore).toHaveAttribute("open", "");
  const building = page.locator('[data-chapter="building"]');
  await expect(building).not.toHaveAttribute("open", "");
  await page.keyboard.press("Control+k");
  const search = page.getByRole("searchbox");
  await expect(search).toBeFocused();
  await search.fill("bun run");
  await expect(building).toHaveAttribute("open", "");
  await expect(
    building.getByRole("link", { name: "Getting started", exact: true }),
  ).toBeVisible();
  await search.fill("no-public-document-matches-this-needle");
  await expect(page.locator("[data-search-status]")).toContainText("No topic");
  await search.press("Escape");
  await expect(building).not.toHaveAttribute("open", "");
  await expect(lore).toHaveAttribute("open", "");
});

test("search recovers after a failed index request", async ({ page }) => {
  await page.route("**/en/search.json", (route) =>
    route.fulfill({ status: 503, body: "unavailable" }),
  );
  await page.goto("/en/documentation/");
  await page.getByRole("searchbox").focus();
  await expect(page.locator("[data-search-status]")).toContainText(
    "could not be loaded",
  );
  await page.unroute("**/en/search.json");
  await page.getByRole("button", { name: "Retry search" }).click();
  await page.getByRole("searchbox").fill("Bun");
  await expect(page.locator("[data-search-status]")).toContainText("results");
});

test("Markdown copying reports success and failures without sending a ChatGPT message", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text: string) => {
          (window as unknown as { copied: string }).copied = text;
        },
      },
      configurable: true,
    }),
  );
  await page.goto("/en/documentation/records/");
  const copyButton = page.getByRole("button", {
    name: "Copy Markdown",
    exact: true,
  });
  await expect(copyButton.locator("svg")).toBeVisible();
  await copyButton.click();
  await expect(page.getByRole("tooltip")).toContainText("Copied");
  const raw = await (await page.request.get("/en/source/records.md")).text();
  expect(
    await page.evaluate(() => (window as unknown as { copied: string }).copied),
  ).toBe(raw);
  await expect(
    page.getByRole("link", { name: /Open in ChatGPT/ }),
  ).toHaveAttribute("href", "https://chatgpt.com/");
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new Error("denied");
        },
      },
      configurable: true,
    }),
  );
  await copyButton.click();
  await expect(page.getByRole("tooltip")).toContainText("Could not copy");
});

test("documentation tables wrap at spaces instead of breaking short words", async ({
  page,
}) => {
  await page.goto("/en/documentation/records/");
  const table = page.locator(".prose table").first();
  const frame = page.locator(".prose .table-scroll").first();
  await expect(table).toBeVisible();
  const styles = await frame.evaluate((element) => {
    const cell = element.querySelector("td");
    const table = element.querySelector("table")!;
    return {
      tableWrap: getComputedStyle(table).overflowWrap,
      cellWrap: cell ? getComputedStyle(cell).overflowWrap : null,
      overflowX: getComputedStyle(element).overflowX,
      tableWidth: table.getBoundingClientRect().width,
      frameWidth: element.getBoundingClientRect().width,
    };
  });
  expect(styles.tableWrap).toBe("normal");
  expect(styles.cellWrap).toBe("break-word");
  expect(styles.overflowX).toBe("auto");
  expect(styles.tableWidth).toBeCloseTo(styles.frameWidth, 0);
});

test("shared lore keeps Korean navigation and local images; old About fragments find the new page", async ({
  page,
}) => {
  await page.goto("/ko/documentation/lore-anatomy/");
  await expect(page.locator(".language-notice")).toBeVisible();
  await expect(page.locator(".prose")).toHaveAttribute("lang", "en");
  expect(
    await page
      .locator(".prose img")
      .evaluate(
        (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
      ),
  ).toBe(true);
  await expect(
    page
      .locator(".prose")
      .getByRole("link", { name: "anchor", exact: true })
      .first(),
  ).toHaveAttribute("href", "/ko/documentation/lore-anchors/");
  await page.goto("/en/about/project/#terms");
  await expect(page).toHaveURL(/\/en\/about\/terms\/$/);
});

test("core navigation and documents work without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 375, height: 812 },
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4321/en/documentation/records/");
  await expect(page.locator(".prose h2").first()).toBeVisible();
  await page.locator(".chapter-disclosure>summary").click();
  await page.locator('[data-chapter="lore"]>summary').click();
  await expect(
    page
      .locator('[data-chapter="lore"]')
      .getByRole("link", { name: "Anatomy", exact: true }),
  ).toBeVisible();
  await page.locator("[data-mobile-menu]>summary").click();
  await expect(
    page.getByRole("navigation", { name: "Project navigation", exact: true }),
  ).toBeVisible();
  await context.close();
});

for (const locale of ["en", "ko"])
  for (const width of [375, 768, 1024, 1440]) {
    test(`reading and page layouts fit ${locale} at ${width}px`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      for (const path of [
        "",
        "documentation/records/",
        "about/project/",
        "about/team/",
        "about/terms/",
        "sponsor/",
      ]) {
        await page.goto(`/${locale}/${path}`);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          path,
        ).toBe(true);
        await page.screenshot({
          path: info.outputPath(
            `${path ? path.replaceAll("/", "-") : "home"}.png`,
          ),
          fullPage: true,
        });
      }
    });
  }
