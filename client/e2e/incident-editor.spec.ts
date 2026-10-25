import { expect, test } from "@playwright/test";

const account =
  "## Witness account\n\nThe platform lights went out at **02:17**. [[INC-00014]]\n\n> No train was scheduled.\n\n| Time | Observation |\n| --- | --- |\n| 02:17 | A door opened. |";

test("local incident writing, selection, undo, fonts and reload", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/en/site/write/editor");
  await page.getByRole("button", { name: "Understood", exact: true }).click();
  await expect(
    page.getByRole("tab", { name: "Form information", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page
    .getByLabel("What is this incident called?")
    .fill("The empty platform");
  await page
    .getByRole("checkbox", { name: "No warnings apply", exact: true })
    .check();
  await page.getByRole("tab", { name: "Content", exact: true }).click();
  const input = page.getByLabel("Incident Markdown", { exact: true });
  await input.fill(account);
  await input.press("Control+Home");
  await input.press("ArrowRight");
  const selection = await input.evaluate((element) => ({
    start: (element as HTMLTextAreaElement).selectionStart,
    end: (element as HTMLTextAreaElement).selectionEnd,
  }));
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Witness account" }),
  ).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "INC-00014", exact: true }),
  ).toHaveAttribute("href", "/en/site/records/INC-00014");
  await page.getByRole("tab", { name: "Editor", exact: true }).click();
  expect(
    await input.evaluate((element) => ({
      start: (element as HTMLTextAreaElement).selectionStart,
      end: (element as HTMLTextAreaElement).selectionEnd,
    })),
  ).toEqual(selection);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(input).toHaveValue("");
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(input).toHaveValue(account);
  await input.press("Control+z");
  await expect(input).toHaveValue("");
  await input.press("Control+Shift+z");
  await expect(input).toHaveValue(account);
  for (const font of ["sans", "serif", "mono"]) {
    await page.getByLabel("Editor font", { exact: true }).selectOption(font);
    const metrics = await page
      .locator(".w-md-editor-text-input, .w-md-editor-text-pre > code")
      .evaluateAll((elements) =>
        elements.map((element) => {
          const style = getComputedStyle(element);
          return [
            style.fontFamily,
            style.fontSize,
            style.lineHeight,
            style.fontWeight,
            style.letterSpacing,
          ];
        }),
      );
    expect(metrics[0]).toEqual(metrics[1]);
  }
  await page.getByLabel("Editor font", { exact: true }).selectOption("sans");
  await expect(
    page.getByRole("status").filter({ hasText: "Saved in this browser" }),
  ).toBeVisible();
  await page.screenshot({
    path: "/tmp/circa-editor-desktop.png",
    fullPage: true,
  });
  await page.reload();
  await expect(page.getByLabel("What is this incident called?")).toHaveValue(
    "The empty platform",
  );
  await page.getByRole("tab", { name: "Content", exact: true }).click();
  await expect(input).toHaveValue(account);
  await expect(page.getByLabel("Editor font", { exact: true })).toHaveValue(
    "sans",
  );
});

test("restricted imports, temporary entities and attached image restoration", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/en/site/write/editor");
  await page.getByRole("button", { name: "Understood", exact: true }).click();
  await page.getByRole("tab", { name: "Imports", exact: true }).click();
  await page.getByLabel("Search the registry", { exact: true }).fill("Mara");
  await page
    .getByRole("button", { name: "Import character", exact: true })
    .click();
  const modal = page.getByRole("dialog", { name: "Restricted character" });
  await expect(
    modal.getByRole("button", { name: "Acknowledge and import" }),
  ).toBeDisabled();
  await modal
    .getByLabel("I understand the character usage guidelines.")
    .check();
  await modal.getByRole("button", { name: "Acknowledge and import" }).click();
  await expect(
    page.getByText("Imported for this draft", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Insert reference", exact: true })
    .click();
  const input = page.getByLabel("Incident Markdown", { exact: true });
  await expect(input).toHaveValue("[[CHR-018257]]");
  await page.getByLabel("Entity type", { exact: true }).selectOption("ITM");
  await page.getByLabel("Entity name", { exact: true }).fill("The receiver");
  await page
    .getByRole("button", { name: "Create entity", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "TEMP-ITM-01 The receiver" }),
  ).toBeVisible();
  await page.getByLabel("Image file", { exact: true }).setInputFiles({
    name: "door.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aGQkAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await page
    .getByLabel("Caption / alternative text", { exact: true })
    .fill("A platform door");
  await page.getByRole("button", { name: "Attach image", exact: true }).click();
  await page.getByRole("button", { name: "Insert image", exact: true }).click();
  await expect(input).toHaveValue(/TEMP-EVI-01/);
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  const image = page.getByRole("img", { name: "A platform door", exact: true });
  await expect(image).toHaveAttribute("src", /^blob:/);
  await expect
    .poll(() =>
      image.evaluate((element) => (element as HTMLImageElement).naturalWidth),
    )
    .toBe(1);
  await expect(
    page.getByRole("status").filter({ hasText: "Saved in this browser" }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("tab", { name: "Content", exact: true }).click();
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  await expect(
    page.getByRole("img", { name: "A platform door", exact: true }),
  ).toHaveAttribute("src", /^blob:/);
  await page.getByRole("tab", { name: "Imports", exact: true }).click();
  const temporary = page.locator("li").filter({
    has: page.getByRole("button", { name: "TEMP-EVI-01 A platform door" }),
  });
  await temporary.getByRole("button", { name: "Remove", exact: true }).click();
  await page.getByRole("tab", { name: "Editor", exact: true }).click();
  await expect(input).toHaveValue(/TEMP-EVI-01/);
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  await expect(
    page.getByRole("img", { name: "full|A platform door" }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Image not available in this draft — A platform door"),
  ).toBeVisible();
});

test("mobile registry keyboard focus and Korean route", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/site/write/editor");
  await page.getByRole("button", { name: "Understood", exact: true }).click();
  const opener = page.getByRole("button", { name: "Open entity registry" });
  await opener.click();
  const drawer = page.getByRole("dialog", { name: "Entity registry" });
  await expect(drawer).toBeVisible();
  await drawer.getByRole("tab", { name: "Imports", exact: true }).click();
  await drawer.getByLabel("Search the registry", { exact: true }).fill("Elias");
  await drawer
    .getByRole("button", { name: "Import character", exact: true })
    .click();
  await expect(
    drawer.getByText("Imported for this draft", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).not.toBeVisible();
  await expect(opener).toBeFocused();
  await page
    .getByLabel("What is this incident called?")
    .fill("The night office");
  await page.screenshot({
    path: "/tmp/circa-editor-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("status").filter({ hasText: "Saved in this browser" }),
  ).toBeVisible();
  await page.goto("/ko/site/write/editor");
  await expect(
    page.getByRole("heading", { name: "사건 기록 작성실", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("이 사건의 명칭은 무엇입니까?")).toHaveValue(
    "The night office",
  );
  await page.screenshot({
    path: "/tmp/circa-editor-korean-mobile.png",
    fullPage: true,
  });
});

for (const width of [1440, 390]) {
  test(`horizontal editor navigation and quick actions at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/en/site/write/editor");
    await page.getByRole("button", { name: "Understood", exact: true }).click();
    const form = page.getByRole("tab", {
      name: "Form information",
      exact: true,
    });
    const content = page.getByRole("tab", { name: "Content", exact: true });
    const formBox = await form.boundingBox();
    const contentBox = await content.boundingBox();
    const panelBox = await page
      .getByRole("tabpanel", { name: "Form information", exact: true })
      .boundingBox();
    expect(Math.abs(formBox!.y - contentBox!.y)).toBeLessThan(1);
    expect(contentBox!.x).toBeGreaterThan(formBox!.x);
    expect(panelBox!.y).toBeGreaterThanOrEqual(formBox!.y + formBox!.height);
    await form.focus();
    await page.keyboard.press("ArrowRight");
    await expect(content).toHaveAttribute("aria-selected", "true");
    const input = page.getByLabel("Incident Markdown", { exact: true });
    await input.fill("Witness account");
    await page
      .getByRole("combobox", { name: "Headings", exact: true })
      .selectOption("6");
    await expect(input).toHaveValue("###### Witness account");
    for (const [action, expected] of [
      ["Inline code", "`code`"],
      ["Code block", "```\ncode\n```"],
      ["External reference", "[link]()"],
      ["Internal reference", "[[]]"],
      ["Redact", "||redact||"],
    ]) {
      await input.fill("");
      await page.getByRole("button", { name: action, exact: true }).click();
      await expect(input).toHaveValue(expected);
    }
    await input.fill(account);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page
      .getByRole("heading", { name: "Incident filing desk", exact: true })
      .scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `/tmp/circa-editor-tabs-${width}.png`,
      fullPage: true,
    });
  });
}
