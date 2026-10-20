import { expect, test, type Page } from "@playwright/test";

const copy = {
  en: { signIn: "Sign in", signUp: "Sign up", signOut: "Sign out", personal: "Personal access", username: "Username", identifier: "Username or email", email: "Email", password: "Password", show: "Show password", aboutArchive: "About the archive", aboutSite: "About the site" },
  ko: { signIn: "로그인", signUp: "회원 가입", signOut: "로그아웃", personal: "개인 열람", username: "사용자 이름", identifier: "사용자 이름 또는 이메일", email: "이메일", password: "비밀번호", show: "비밀번호 표시", aboutArchive: "기록 보관소 소개", aboutSite: "사이트 소개" },
};

async function inspectLayout(page: Page, name: string) {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `/tmp/circa-auth-${name}-${width}.png`, fullPage: true });
  }
}

for (const locale of ["en", "ko"] as const) {
  const t = copy[locale];
  test(`${locale}: register, visit both access links, sign in, refresh, and sign out through the UI`, async ({ page, context }) => {
    await page.goto(`/${locale}/account`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/sign-in$`));
    const cookieNotice = page.getByRole("region", { name: locale === "en" ? "Cookie notice" : "쿠키 안내" });
    await expect(cookieNotice).toBeVisible();
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.screenshot({ path: `/tmp/circa-cookie-${locale}-${width}.png`, fullPage: false });
    }
    await cookieNotice.getByRole("button", { name: locale === "en" ? "Understood" : "확인했습니다" }).click();
    await expect(cookieNotice).toHaveCount(0);
    await page.reload();
    await expect(cookieNotice).toHaveCount(0);
    await page.getByRole("link", { name: t.signUp, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/sign-up$`));
    await expect(page.getByRole("search")).toHaveCount(0);
    const analyst = page.getByRole("status");
    await expect(analyst).toHaveText(/^[A-Z]\. /);
    await page.getByRole("button", { name: locale === "en" ? "Reroll name" : "이름 다시 뽑기", exact: true }).click();
    await expect(page.getByRole("button", { name: t.signUp, exact: true })).toBeEnabled();
    const selectedName = await analyst.textContent();
    await inspectLayout(page, `${locale}-sign-up`);
    const username = `ui_${crypto.randomUUID().replaceAll("-", "").slice(0, 14)}`;
    await page.getByLabel(t.username, { exact: true }).fill(username);
    await page.getByLabel(t.email, { exact: true }).fill(`${username}@example.com`);
    await page.getByLabel(t.password, { exact: true }).fill("Password123!");
    await page.getByRole("button", { name: t.signUp, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/account$`));
    await expect(page.getByRole("heading", { name: t.personal })).toBeVisible();
    await expect(page.getByText(username, { exact: true })).toBeVisible();
    await expect(page.getByText(selectedName!, { exact: true })).toBeVisible();
    await expect(page.getByText(/^\d{9}@my\.circa\.archive$/)).toBeVisible();
    const sections = page.getByRole("navigation", { name: locale === "en" ? "Personal register sections" : "개인 등록부 항목" });
    await sections.getByRole("link", { name: locale === "en" ? "Account particulars" : "계정 등록 사항" }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/account#account-details$`));
    await expect(page.locator("#account-details time")).toBeVisible();
    await inspectLayout(page, `${locale}-account`);
    expect(await page.evaluate(() => document.cookie)).not.toMatch(/circa_(at|rt)/);
    const credentials = (await context.cookies()).filter(cookie => ["circa_at", "circa_rt"].includes(cookie.name));
    expect(credentials).toHaveLength(2);
    expect(credentials.every(cookie => cookie.httpOnly)).toBe(true);
    await page.goto(`/${locale}`);
    await expect(page.getByRole("link", { name: t.personal, exact: true })).toHaveAttribute("href", `/${locale}/account`);
    await page.goto(`/${locale}/site`);
    await expect(page.getByRole("banner").getByRole("link", { name: t.personal })).toBeVisible();
    // The project link now immediately follows the archive guide in the section bar.
    const sectionLink = page.locator(`nav a[href="/${locale}/site/about"]`).first();
    await expect(sectionLink.locator("xpath=following-sibling::*[1]")).toHaveAttribute("href", `/${locale}/meta`);
    await page.getByRole("banner").getByRole("link", { name: t.personal }).click();
    await page.getByRole("button", { name: t.signOut, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/site$`));
    await page.getByRole("banner").getByRole("link", { name: t.signIn, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/sign-in$`));
    await expect(page.getByRole("heading", { name: t.signIn, exact: true })).toBeVisible();
    await inspectLayout(page, `${locale}-sign-in`);
    await page.getByLabel(t.identifier).fill(`${username}@example.com`);
    const password = page.getByLabel(t.password, { exact: true });
    await expect(password).toHaveAttribute("autocomplete", "current-password");
    await password.fill("Password123!");
    await page.getByLabel(t.show).check();
    await expect(password).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: t.signIn, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/account$`));
    await page.reload();
    await expect(page.getByText(username, { exact: true })).toBeVisible();
    const before = (await context.cookies()).find(cookie => cookie.name === "circa_rt")!.value;
    await context.clearCookies({ name: "circa_at" });
    await page.reload();
    await expect(page.getByText(username, { exact: true })).toBeVisible();
    expect((await context.cookies()).find(cookie => cookie.name === "circa_rt")!.value).not.toBe(before);
    await page.goto(`/${locale}/sign-in`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/account$`));
    await page.route("**/api/v1/auth/logout", route => route.fulfill({ status: 503 }));
    await page.getByRole("button", { name: t.signOut, exact: true }).click();
    await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/${locale}/account$`));
    await page.unroute("**/api/v1/auth/logout");
    await page.getByRole("button", { name: t.signOut, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/site$`));
    expect((await context.cookies()).filter(cookie => ["circa_at", "circa_rt"].includes(cookie.name))).toEqual([]);
    expect((await page.request.post("/api/v1/records")).status()).toBe(401);
    await page.goto(`/${locale}`);
    await expect(page.getByRole("link", { name: t.signIn, exact: true })).toBeVisible();
  });
}

test("failed credentials, throttling, and offline submission preserve the form", async ({ page }) => {
  await page.goto("/en/sign-in");
  await page.getByLabel("Username or email").fill("absent-reader");
  await page.getByLabel("Password", { exact: true }).fill("Password123!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("The username or password is incorrect.");
  await page.route("**/api/v1/auth/login", route => route.fulfill({ status: 429, json: { code: "rate_limit_exceeded" } }));
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Too many attempts.");
  await page.unroute("**/api/v1/auth/login");
  await page.route("**/api/v1/auth/login", route => route.abort());
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Access is temporarily unavailable.");
  await expect(page.getByLabel("Password", { exact: true })).toHaveValue("Password123!");
  await page.goto("/en/site");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("the forms support keyboard submission and reject missing or short particulars", async ({ page }) => {
  await page.goto("/en/sign-up");
  await page.getByRole("button", { name: "Sign up", exact: true }).click();
  await expect(page.getByLabel("Username", { exact: true })).toBeFocused();
  const username = `keys_${crypto.randomUUID().replaceAll("-", "").slice(0, 14)}`;
  await page.keyboard.type(username);
  await page.keyboard.press("Tab");
  await page.keyboard.type(`${username}@example.com`);
  await page.keyboard.press("Tab");
  await page.keyboard.type("short");
  await page.keyboard.press("Enter");
  expect(await page.getByLabel("Password", { exact: true }).evaluate((input: HTMLInputElement) => input.validity.tooShort)).toBe(true);
  await expect(page).toHaveURL(/\/en\/sign-up$/);
  await page.getByLabel("Password", { exact: true }).fill("Password123!");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/en\/account$/);
});
