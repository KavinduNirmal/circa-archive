import { expect, test } from "@playwright/test";

test("login survives reload and cookies remain unreadable from JavaScript", async ({ page, context }) => {
  await page.goto("/en/site");
  const username = `browser_${crypto.randomUUID().replaceAll("-", "")}`;
  const registered = await page.request.post("/api/v1/auth/register", {
    data: { username, email: `${username}@example.com`, password: "Password123!" },
  });
  expect(registered.status()).toBe(201);
  await page.request.post("/api/v1/auth/logout");
  const loggedIn = await page.evaluate(async ({ username }) => {
    const response = await fetch("/api/v1/auth/login", {
      method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: username, password: "Password123!" }),
    });
    return { status: response.status, account: await response.json() };
  }, { username });
  expect(loggedIn.status).toBe(200);
  expect(loggedIn.account.username).toBe(username);
  expect(JSON.stringify(loggedIn.account)).not.toMatch(/token/i);
  await page.reload();
  expect(await page.evaluate(() => document.cookie)).not.toMatch(/circa_(at|rt)/);
  expect((await page.request.get("/api/v1/auth/me")).status()).toBe(200);
  expect((await context.cookies()).filter(cookie => cookie.name.startsWith("circa_")).every(cookie => cookie.httpOnly)).toBe(true);
});

test("expired access refreshes on navigation and logout denies the next write", async ({ page, context }) => {
  await page.goto("/ko/site");
  const username = `expiry_${crypto.randomUUID().replaceAll("-", "")}`;
  expect((await page.request.post("/api/v1/auth/register", {
    data: { username, email: `${username}@example.com`, password: "Password123!" },
  })).status()).toBe(201);
  const before = (await context.cookies()).find(cookie => cookie.name === "circa_rt")!.value;
  // Browser expiry removes the access cookie after ten minutes; simulate it without waiting.
  await context.clearCookies({ name: "circa_at" });
  await page.reload();
  expect(page.url()).toContain("/ko/site");
  const after = await context.cookies();
  expect(after.find(cookie => cookie.name === "circa_at")).toBeDefined();
  expect(after.find(cookie => cookie.name === "circa_rt")!.value).not.toBe(before);
  expect((await page.request.get("/api/v1/auth/me")).status()).toBe(200);
  expect((await page.request.post("/api/v1/auth/logout")).status()).toBe(204);
  expect((await context.cookies()).filter(cookie => cookie.name.startsWith("circa_"))).toEqual([]);
  expect((await page.request.post("/api/v1/records")).status()).toBe(401);
});
