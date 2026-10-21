import { test, expect } from "@playwright/test";
test("home follows the editorial narrative and retains the agency motto", async ({
  page,
}) => {
  await page.goto("/en/");
  expect(
    await page
      .locator("main > section")
      .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("data-section"))),
  ).toEqual([
    "hero",
    "identity",
    "introduction",
    "editions",
    "documentation",
    "building",
    "contribution",
    "questions",
  ]);
  await expect(
    page.getByText("Continuity of record. Continuity of administration.", {
      exact: true,
    }),
  ).toBeVisible();
});
test("shallow pages have no breadcrumbs and sponsor offers both support destinations", async ({
  page,
}) => {
  await page.goto("/en/sponsor/");
  await expect(page.locator(".breadcrumbs")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: /Buy me a coffee/i }),
  ).toHaveAttribute("href", "https://buymeacoffee.com/kavindunirmal");
  await expect(
    page.getByRole("link", { name: /Sponsor on GitHub/i }),
  ).toHaveAttribute("href", "https://github.com/sponsors/KavinduNirmal");
});
test("team uses a portrait group with an image failure fallback", async ({
  page,
}) => {
  await page.goto("/en/about/team/");
  await expect(page.locator('[data-slot="avatar-group"]')).toBeVisible();
  await expect(page.locator('[data-slot="avatar-image"]')).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Kavindu Nirmal", exact: true }),
  ).toBeVisible();
  await page.route("**/portraits/*", (r) => r.abort());
  await page.reload();
  await expect(
    page.locator('[data-slot="avatar-fallback"]').filter({ hasText: "KN" }),
  ).toBeVisible();
});
test("mobile chapters start compact and remain accessible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/en/documentation/");
  await expect(page.locator(".chapter-disclosure")).not.toHaveAttribute(
    "open",
    "",
  );
  await page.locator(".chapter-disclosure > summary").click();
  await expect(page.getByRole("searchbox")).toBeVisible();
});

test("publication controls use the shared type and geometry; document introduction appears once", async ({
  page,
}) => {
  await page.goto("/en/");
  const styles = await page
    .locator("a.button")
    .first()
    .evaluate((el) => {
      const css = getComputedStyle(el);
      return {
        font: css.fontFamily,
        transform: css.textTransform,
        radius: css.borderRadius,
        height: el.getBoundingClientRect().height,
      };
    });
  expect(styles.font).toContain("IBM Plex Mono");
  expect(styles.transform).toBe("uppercase");
  expect(styles.radius).toBe("0px");
  expect(styles.height).toBeGreaterThanOrEqual(44);
  await page.goto("/en/documentation/");
  await expect(page.locator(".breadcrumbs")).toHaveCount(1);
  await expect(
    page.getByText(
      "The setting, the records, and the machinery behind them. Read the overview, explore the lore, contribute, or build the project.",
      { exact: true },
    ),
  ).toHaveCount(1);
});
test("mobile keyboard navigation closes and returns focus; large text reflows", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/en/");
  const menu = page.locator("[data-mobile-menu]>summary");
  await menu.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".main-nav")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await expect(page.locator(".main-nav")).not.toBeVisible();
  await page.goto("/en/about/team/");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("heading", { name: "Kavindu Nirmal", exact: true }),
  ).toBeVisible();
});
