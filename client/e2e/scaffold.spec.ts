import { expect, test } from "@playwright/test";

test("the empty scaffold serves a themed page with project metadata", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("CIRCA Archive");
  await expect(page.locator("html")).toHaveClass("dark");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(13, 19, 26)");
  await expect(page.locator("main")).toHaveCount(0);
});
