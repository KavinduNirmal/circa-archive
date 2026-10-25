import { expect, test } from "@playwright/test";

for (const width of [1440, 620, 390]) {
  test(`About dropdowns remain usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/en/site");
    const nav = page.getByRole("navigation", {
      name: "Public archive navigation",
    });
    const archive = nav.getByRole("button", {
      name: "About the archive",
      exact: true,
    });
    await archive.hover();
    const rules = nav.getByRole("link", { name: "Rules", exact: true });
    await expect(rules).toBeVisible();
    await rules.hover();
    await expect(rules).toBeVisible();
    await page.screenshot({ path: `/tmp/circa-about-dropdown-${width}.png` });
    const box = await rules.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    await archive.focus();
    await page.keyboard.press("Escape");
    await expect(rules).toBeHidden();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    await expect(rules).toBeFocused();
    const site = nav.getByRole("button", {
      name: "About the site",
      exact: true,
    });
    await site.click();
    await expect(
      nav.getByRole("link", { name: "TOS", exact: true }),
    ).toBeVisible();
  });
}
