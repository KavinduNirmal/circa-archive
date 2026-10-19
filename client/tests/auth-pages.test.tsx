import { screen } from "@testing-library/react";
import { createTranslator } from "next-intl";
import { beforeEach, expect, it, vi } from "vitest";
import { AccessPage } from "@/components/auth/access-page";
import { getSessionState } from "@/lib/auth/session";
import { catalogFor, renderWithIntl } from "./intl";

vi.mock("@/lib/auth/session", () => ({ getSessionState: vi.fn() }));
vi.mock("next-intl/server", () => ({ getTranslations: async ({ locale, namespace }: { locale: "en" | "ko"; namespace: string }) =>
  createTranslator({ locale, namespace, messages: catalogFor(locale) }) }));
vi.mock("next/navigation", async importOriginal => ({ ...await importOriginal<typeof import("next/navigation")>(),
  redirect: (href: string) => { throw new Error(`redirect:${href}`); },
}));
const state = vi.mocked(getSessionState);
beforeEach(() => { state.mockReset(); });

it.each(["sign-in", "sign-up"] as const)("redirects an authenticated visitor away from %s", async mode => {
  state.mockResolvedValue({ status: "authenticated", account: { id: "1", username: "reader", role: "author", createdAt: "2026-10-20" } });
  await expect(AccessPage({ mode, locale: "ko" })).rejects.toThrow("redirect:/ko/account");
});

it("redirects a guest account request to sign in", async () => {
  state.mockResolvedValue({ status: "guest" });
  await expect(AccessPage({ mode: "account", locale: "en" })).rejects.toThrow("redirect:/en/sign-in");
});

it("prints account particulars without exposing credential data", async () => {
  state.mockResolvedValue({ status: "authenticated", account: { id: "1", username: "reader", role: "author", createdAt: "2026-10-20" } });
  renderWithIntl(await AccessPage({ mode: "account", locale: "en" }));
  expect(screen.getByRole("heading", { name: "Personal access" })).toBeVisible();
  expect(screen.getByText("reader")).toBeVisible();
  expect(screen.getByText("Author", { exact: true })).toBeVisible();
  expect(screen.getByRole("button", { name: "Sign out" })).toBeVisible();
});

it("keeps an unavailable account session distinct from logout, with a retry link", async () => {
  state.mockResolvedValue({ status: "unavailable" });
  renderWithIntl(await AccessPage({ mode: "account", locale: "ko" }), { locale: "ko" });
  expect(screen.getByRole("heading", { name: "계정 접속 불가" })).toBeVisible();
  expect(screen.getByRole("link", { name: "다시 시도" })).toHaveAttribute("href", "/ko/account");
  expect(screen.queryByRole("button", { name: "로그아웃" })).not.toBeInTheDocument();
});
