import { expect, test } from "@playwright/test";

test("API search opens a sealed incident, its rumours, and a real organization directory entry", async ({
  page,
}) => {
  await page.goto("/en/site/records?q=INC-880001");
  await page.getByRole("button", { name: "Understood", exact: true }).click();
  await page.getByRole("link", { name: "Open INC-880001" }).click();
  await expect(
    page.getByRole("heading", { name: "API destination incident" }),
  ).toBeVisible();
  await expect(page.getByText("The actual incident account.")).toHaveCount(0);
  await page.getByRole("button", { name: "Acknowledge and reveal" }).click();
  await expect(page).toHaveURL(/acknowledge=true/);
  await expect(page.getByText(/The actual incident account/)).toBeVisible();
  await expect(page.locator("#rumour-880002")).toContainText(
    "The actual rumour account.",
  );
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `/tmp/circa-api-reader-${width}.png`,
      fullPage: true,
      caret: "initial",
    });
  }
  await page.goto("/en/site/records?q=ORG-880001");
  await page.getByRole("link", { name: "Open ORG-880001" }).click();
  await expect(
    page.getByText("The actual organization dossier."),
  ).toBeVisible();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `/tmp/circa-api-organization-${width}.png`,
      fullPage: true,
      caret: "initial",
    });
  }
});

test("sealed record is a stub for guests and moderators, and opens for an approved reader", async ({
  page,
  context,
}) => {
  await page.goto("/en/site/records?q=EXP-880001");
  await page.getByRole("button", { name: "Understood", exact: true }).click();
  await page.getByRole("link", { name: "Open EXP-880001" }).click();
  await expect(
    page.getByRole("button", { name: "Request access" }),
  ).toBeVisible();
  await expect(page.getByText("The approved record account.")).toHaveCount(0);
  for (const [name, approved] of [
    ["destination_mod", false],
    ["destination_reader", true],
  ] as const) {
    await context.clearCookies();
    const login = await context.request.post("/api/v1/auth/login", {
      data: { identifier: name, password: "Password123!" },
    });
    expect(login.ok()).toBe(true);
    await page.goto("/en/site/records/EXP-880001?acknowledge=true");
    await expect(page.getByText("The approved record account.")).toHaveCount(
      approved ? 1 : 0,
    );
    if (!approved) {
      await page.getByRole("button", { name: "Request access" }).click();
      await expect(page.getByRole("status")).toContainText(
        "Your access request is pending.",
      );
      await page.reload();
      await expect(page.getByRole("status")).toContainText(
        "Your access request is pending.",
      );
    }
  }
});

test("Korean incident acknowledgment works without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:3102/ko/site/records/INC-880001");
    await expect(page.getByText(/The actual incident account/)).toHaveCount(0);
    await page.getByRole("button", { name: "확인하고 열람" }).click();
    await expect(page.getByText(/The actual incident account/)).toBeVisible();
  } finally {
    await context.close();
  }
});

test("all expanded dossier destinations open from real search results", async ({
  page,
}) => {
  for (const [code, body] of [
    ["CHR-880001", "The actual character dossier."],
    ["ITM-880001", "The actual recovery dossier. 한국어 회수품"],
  ]) {
    await page.goto(`/en/site/records?q=${code}`);
    await page.getByRole("link", { name: `Open ${code}` }).click();
    await expect(page.getByText(body)).toBeVisible();
  }
});

test("cursor pagination preserves filters and supports previous navigation", async ({
  page,
}) => {
  await page.goto(
    "/en/site/records?q=Pagination&holder=PAGINATION&type=incident&limit=10",
  );
  const navigation = page.getByRole("navigation", {
    name: "Search result pages",
  });
  const first = await page.locator("tbody tr").allTextContents();
  await navigation.getByRole("link", { name: "Next" }).click();
  await expect(page).toHaveURL(/cursor=/);
  const second = await page.locator("tbody tr").allTextContents();
  expect(second).toHaveLength(10);
  expect(second.some((row) => first.includes(row))).toBe(false);
  await navigation.getByRole("link", { name: "Next" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(5);
  await navigation.getByRole("link", { name: "Previous" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(10);
  expect(await page.locator("tbody tr").allTextContents()).toEqual(second);
});
