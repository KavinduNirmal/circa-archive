import { expect, test } from "@playwright/test";

test("author landing opens the relocated editor and resumes its draft", async ({
  page,
}) => {
  await page.goto("/en/site/write");
  await expect(
    page.getByRole("heading", { name: "Write", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("No drafts yet.")).toBeVisible();
  await expect(
    page.getByRole("contentinfo").getByRole("link", { name: "Records" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Add Evidence/ }),
  ).toBeDisabled();
  await page.getByRole("link", { name: /Write an incident/ }).click();
  await expect(page).toHaveURL(/\/en\/site\/write\/editor$/);
  await expect(
    page.getByText("Saved in this browser", { exact: true }),
  ).toBeVisible();
  await page.goto("/en/site/write");
  await expect(
    page.getByRole("link", { name: /Untitled incident/ }),
  ).toBeVisible();
  await page.screenshot({
    path: "/tmp/circa-write-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("link", { name: /Write an incident/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "/tmp/circa-write-mobile.png",
    fullPage: true,
  });
});
