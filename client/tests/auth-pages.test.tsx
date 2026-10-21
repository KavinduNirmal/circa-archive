import { screen, within } from "@testing-library/react";
import { createTranslator } from "next-intl";
import { beforeEach, expect, it, vi } from "vitest";
import { AccessPage } from "@/components/auth/access-page";
import { getSessionState } from "@/lib/auth/session";
import { catalogFor, renderWithIntl } from "./intl";

vi.mock("@/lib/auth/session", () => ({ getSessionState: vi.fn() }));
vi.mock("next-intl/server", () => ({
  getTranslations: async ({
    locale,
    namespace,
  }: {
    locale: "en" | "ko";
    namespace: string;
  }) => createTranslator({ locale, namespace, messages: catalogFor(locale) }),
}));
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  redirect: (href: string) => {
    throw new Error(`redirect:${href}`);
  },
}));
const state = vi.mocked(getSessionState);
beforeEach(() => {
  state.mockReset();
});

it.each(["sign-in", "sign-up"] as const)(
  "redirects an authenticated visitor away from %s",
  async (mode) => {
    state.mockResolvedValue({
      status: "authenticated",
      account: {
        id: "1",
        username: "reader",
        role: "author",
        createdAt: "2026-10-20",
        displayId: "123456789",
        displayName: "H. John Doe",
        displayEmail: "123456789@my.circa.archive",
        adoptedOrganizationId: null,
      },
    });
    await expect(AccessPage({ mode, locale: "ko" })).rejects.toThrow(
      "redirect:/ko/account",
    );
  },
);

it("redirects a guest account request to sign in", async () => {
  state.mockResolvedValue({ status: "guest" });
  await expect(AccessPage({ mode: "account", locale: "en" })).rejects.toThrow(
    "redirect:/en/sign-in",
  );
});

it("prints account particulars without exposing credential data", async () => {
  state.mockResolvedValue({
    status: "authenticated",
    account: {
      id: "1",
      username: "reader",
      role: "author",
      createdAt: "2026-10-20",
      displayId: "123456789",
      displayName: "H. John Doe",
      displayEmail: "123456789@my.circa.archive",
      adoptedOrganizationId: null,
    },
  });
  renderWithIntl(await AccessPage({ mode: "account", locale: "en" }));
  expect(
    screen.getByRole("heading", { name: "Personal access" }),
  ).toBeVisible();
  expect(screen.getByText("reader")).toBeVisible();
  expect(screen.getByText("H. John Doe")).toBeVisible();
  expect(screen.getByText("123456789")).toBeVisible();
  expect(screen.getByText("123456789@my.circa.archive")).toBeVisible();
  expect(screen.getByText("my.circa.archive", { exact: true })).toBeVisible();
  expect(screen.getByText("Author", { exact: true })).toBeVisible();
  expect(screen.getByRole("button", { name: "Sign out" })).toBeVisible();
});

it("keeps an unavailable account session distinct from logout, with a retry link", async () => {
  state.mockResolvedValue({ status: "unavailable" });
  renderWithIntl(await AccessPage({ mode: "account", locale: "ko" }), {
    locale: "ko",
  });
  expect(screen.getByRole("heading", { name: "계정 접속 불가" })).toBeVisible();
  expect(screen.getByRole("link", { name: "다시 시도" })).toHaveAttribute(
    "href",
    "/ko/account",
  );
  expect(
    screen.queryByRole("button", { name: "로그아웃" }),
  ).not.toBeInTheDocument();
});

it.each(["en", "ko"] as const)(
  "provides an account section index and current profile data in %s",
  async (locale) => {
    state.mockResolvedValue({
      status: "authenticated",
      account: {
        id: "019a04d6-7d00-7000-8000-000000000001",
        username: "reader",
        role: "moderator",
        createdAt: "2026-10-20T00:00:00Z",
        displayId: "123456789",
        displayName: "H. John Doe",
        displayEmail: "123456789@my.circa.archive",
        adoptedOrganizationId: "019a04d6-7d00-7000-8000-000000000002",
      },
    });
    renderWithIntl(await AccessPage({ mode: "account", locale }), { locale });
    const nav = screen.getByRole("navigation", {
      name: locale === "en" ? "Personal register sections" : "개인 등록부 항목",
    });
    const identity = screen.getByRole("region", {
      name: locale === "en" ? "Archive identity" : "기록 보관소 신원",
    });
    const particulars = screen.getByRole("region", {
      name: locale === "en" ? "Account particulars" : "계정 등록 사항",
    });
    const session = screen.getByRole("region", {
      name: locale === "en" ? "Session access" : "세션 접속",
    });
    for (const section of [identity, particulars, session]) {
      expect(
        within(nav).getByRole("link", {
          name: new RegExp(section.getAttribute("aria-label")!),
        }),
      ).toHaveAttribute("href", `#${section.id}`);
    }
    expect(within(identity).getByText("H. John Doe")).toBeVisible();
    expect(
      within(identity).getByText("019a04d6-7d00-7000-8000-000000000002"),
    ).toBeVisible();
    expect(
      within(particulars).getByText("019a04d6-7d00-7000-8000-000000000001"),
    ).toBeVisible();
    expect(
      within(particulars).getByText(locale === "en" ? "Moderator" : "관리자"),
    ).toBeVisible();
    expect(particulars.querySelector("time")).toHaveAttribute(
      "datetime",
      "2026-10-20T00:00:00Z",
    );
    expect(
      within(session).getByRole("button", {
        name: locale === "en" ? "Sign out" : "로그아웃",
      }),
    ).toBeVisible();
  },
);
