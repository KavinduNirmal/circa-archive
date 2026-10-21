import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CookieNotice } from "@/components/auth/cookie-notice";
import { renderWithIntl } from "./intl";

beforeEach(() => {
  document.cookie = "circa_cookie_notice=; Max-Age=0; Path=/";
});
afterEach(() => vi.restoreAllMocks());

it.each(["en", "ko"] as const)(
  "explains necessary cookies and can be dismissed in %s",
  async (locale) => {
    renderWithIntl(<CookieNotice />, { locale });
    const notice = screen.getByRole("region", {
      name: locale === "en" ? "Cookie notice" : "쿠키 안내",
    });
    expect(notice).toHaveTextContent(
      locale === "en" ? "necessary cookies" : "필수 쿠키",
    );
    const details = screen.getByText(
      locale === "en" ? "Cookie details" : "쿠키 상세 정보",
      { exact: true },
    );
    await userEvent.click(details);
    expect(screen.getByText(/circa_at/)).toBeVisible();
    await userEvent.click(
      screen.getByRole("button", {
        name: locale === "en" ? "Understood" : "확인했습니다",
      }),
    );
    expect(
      screen.queryByRole("region", {
        name: locale === "en" ? "Cookie notice" : "쿠키 안내",
      }),
    ).not.toBeInTheDocument();
    expect(document.cookie).toContain("circa_cookie_notice=v1");
  },
);

it("does not repeat an acknowledged notice after remounting", async () => {
  const first = renderWithIntl(<CookieNotice />);
  await userEvent.click(screen.getByRole("button", { name: "Understood" }));
  first.unmount();
  renderWithIntl(<CookieNotice />);
  expect(
    screen.queryByRole("region", { name: "Cookie notice" }),
  ).not.toBeInTheDocument();
});

it("can dismiss the notice for this page when cookies are blocked", async () => {
  vi.spyOn(document, "cookie", "set").mockImplementation(() => {
    throw new DOMException("Blocked", "SecurityError");
  });
  renderWithIntl(<CookieNotice />);
  await userEvent.click(screen.getByRole("button", { name: "Understood" }));
  expect(
    screen.queryByRole("region", { name: "Cookie notice" }),
  ).not.toBeInTheDocument();
});
