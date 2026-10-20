import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthForm } from "@/components/auth/auth-form";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AccessLink } from "@/components/auth/access-link";
import { authFetch } from "@/lib/auth/client";
import { renderWithIntl } from "./intl";

vi.mock("@/lib/auth/client", () => ({ authFetch: vi.fn() }));
const request = vi.mocked(authFetch);
const account = { id: "reader-id", username: "reader", role: "author" as const, createdAt: "2026-10-20", displayId: "123456789", displayName: "H. John Doe", displayEmail: "123456789@my.circa.archive", adoptedOrganizationId: null };
const preview = { displayName: "H. John Doe" };
function respondWith(response: Response) {
  request.mockImplementation(async path => path.endsWith("/display-name") ? Response.json(preview) : response);
}
beforeEach(() => { request.mockReset(); respondWith(Response.json(account)); });

async function enterCredentials(mode: "sign-in" | "sign-up" = "sign-in") {
  const user = userEvent.setup();
  if (mode === "sign-up") {
    await user.type(screen.getByLabelText("Username", { exact: true }), "reader");
    await user.type(screen.getByLabelText("Email"), "reader@example.com");
  } else await user.type(screen.getByLabelText("Username or email"), "reader");
  await user.type(screen.getByLabelText("Password", { exact: true }), "Password123!");
  return user;
}

describe("personal access navigation", () => {
  it("links guests to sign in in the current language", () => {
    renderWithIntl(<AccessLink state={{ status: "guest" }} />);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/en/sign-in");
  });
  it("links authenticated readers to their account", () => {
    renderWithIntl(<AccessLink state={{ status: "authenticated", account }} />);
    expect(screen.getByRole("link", { name: "Personal access" })).toHaveAttribute("href", "/en/account");
  });
  it("does not misreport an API outage as a signed-out session", () => {
    renderWithIntl(<AccessLink state={{ status: "unavailable" }} />);
    expect(screen.getByRole("link", { name: "Access" })).toHaveAttribute("href", "/en/sign-in");
  });
});

describe("authentication forms", () => {
  it("previews and rerolls an analyst name, then submits the selected identity", async () => {
    request.mockImplementation(async path => path.endsWith("/display-name")
      ? Response.json({ displayName: request.mock.calls.filter(([url]) => url.endsWith("/display-name")).length === 1 ? "H. John Doe" : "A. Jane Ward" })
      : Response.json(account, { status: 201 }));
    renderWithIntl(<AuthForm mode="sign-up" onSuccess={vi.fn()} />);
    expect(await screen.findByText("H. John Doe")).toBeVisible();
    const user = await enterCredentials("sign-up");
    await user.click(screen.getByRole("button", { name: "Reroll name" }));
    expect(await screen.findByText("A. Jane Ward")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Sign up" }));
    const submission = request.mock.calls.find(([path]) => path.endsWith("/register"));
    expect(JSON.parse(submission![1]!.body as string).displayName).toBe("A. Jane Ward");
  });

  it("keeps the selected name when a reroll is throttled and offers retry", async () => {
    renderWithIntl(<AuthForm mode="sign-up" />);
    await screen.findByText("H. John Doe");
    request.mockResolvedValue(new Response(null, { status: 429 }));
    await userEvent.click(screen.getByRole("button", { name: "Reroll name" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Too many attempts.");
    expect(screen.getByText("H. John Doe")).toBeVisible();
    expect(screen.getByRole("button", { name: "Reroll name" })).toBeEnabled();
  });

  it("can register with a server-assigned name if the preview is unavailable", async () => {
    request.mockImplementation(async path => path.endsWith("/display-name")
      ? new Response(null, { status: 503 }) : Response.json(account, { status: 201 }));
    const done = vi.fn();
    renderWithIntl(<AuthForm mode="sign-up" onSuccess={done} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("A name will be assigned when you register.");
    const user = await enterCredentials("sign-up");
    await user.click(screen.getByRole("button", { name: "Sign up" }));
    const submission = request.mock.calls.find(([path]) => path.endsWith("/register"));
    expect(JSON.parse(submission![1]!.body as string)).not.toHaveProperty("displayName");
    expect(done).toHaveBeenCalledOnce();
  });

  it("enforces the updated username and password rules before submission", async () => {
    renderWithIntl(<AuthForm mode="sign-up" />);
    const user = await enterCredentials("sign-up");
    const username = screen.getByLabelText("Username", { exact: true });
    await user.clear(username);
    await user.type(username, "bad-name");
    await user.click(screen.getByRole("button", { name: "Sign up" }));
    expect(username).toBeInvalid();
    expect(request.mock.calls.some(([path]) => path.endsWith("/register"))).toBe(false);
    await user.clear(username);
    await user.type(username, "reader");
    const password = screen.getByLabelText("Password", { exact: true });
    await user.clear(password);
    await user.type(password, "passwordonly");
    await user.click(screen.getByRole("button", { name: "Sign up" }));
    expect(password).toBeInvalid();
    expect(request.mock.calls.some(([path]) => path.endsWith("/register"))).toBe(false);
  });

  it.each(["sign-in", "sign-up"] as const)("submits %s with the existing API contract", async mode => {
    respondWith(Response.json(account, { status: mode === "sign-up" ? 201 : 200 }));
    const done = vi.fn();
    renderWithIntl(<AuthForm mode={mode} onSuccess={done} />);
    const user = await enterCredentials(mode);
    const password = screen.getByLabelText("Password", { exact: true });
    expect(password).toHaveAttribute("autocomplete", mode === "sign-up" ? "new-password" : "current-password");
    await user.click(screen.getByLabelText("Show password"));
    expect(password).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: mode === "sign-up" ? "Sign up" : "Sign in" }));
    const submissions = request.mock.calls.filter(([path]) => !path.endsWith("/display-name"));
    expect(submissions).toHaveLength(1);
    expect(submissions[0][0]).toBe(`/api/v1/auth/${mode === "sign-up" ? "register" : "login"}`);
    const body = JSON.parse(submissions[0][1]!.body as string);
    expect(body).toEqual(mode === "sign-up"
      ? { username: "reader", email: "reader@example.com", password: "Password123!", displayName: "H. John Doe" }
      : { identifier: "reader", password: "Password123!" });
    expect(done).toHaveBeenCalledOnce();
  });

  it.each([
    ["invalid_credentials", 401, "The username or password is incorrect."],
    ["locked", 423, "This account is temporarily locked. Try again later."],
    ["rate_limit_exceeded", 429, "Too many attempts. Please try again later."],
    ["validation_failed", 400, "Check the supplied details and try again."],
  ])("translates %s and retains input", async (code, status, message) => {
    respondWith(Response.json({ code }, { status: Number(status) }));
    renderWithIntl(<AuthForm mode="sign-in" />);
    const user = await enterCredentials();
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(screen.getByLabelText("Username or email")).toHaveValue("reader");
    expect(screen.getByLabelText("Password", { exact: true })).toHaveValue("Password123!");
  });

  it.each(["username_taken", "email_taken"])("associates %s with its field", async code => {
    respondWith(Response.json({ code }, { status: 409 }));
    renderWithIntl(<AuthForm mode="sign-up" />);
    const user = await enterCredentials("sign-up");
    await user.click(screen.getByRole("button", { name: "Sign up" }));
    const field = screen.getByLabelText(code === "username_taken" ? "Username" : "Email", { exact: true });
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAccessibleDescription(/already in use/);
  });

  it("disables submission while pending and prevents a second request", async () => {
    let finish!: (response: Response) => void;
    request.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    renderWithIntl(<AuthForm mode="sign-in" onSuccess={vi.fn()} />);
    const user = await enterCredentials();
    await user.dblClick(screen.getByRole("button", { name: "Sign in" }));
    expect(request).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Please wait…" })).toBeDisabled();
    await act(async () => finish(Response.json(account)));
  });

  it("reports a network failure without losing credentials", async () => {
    request.mockRejectedValue(new TypeError("offline"));
    renderWithIntl(<AuthForm mode="sign-in" />);
    const user = await enterCredentials();
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Access is temporarily unavailable. Please try again.");
    expect(screen.getByLabelText("Password", { exact: true })).toHaveValue("Password123!");
  });

  it("uses Korean labels and preserves the language on its alternate form link", () => {
    renderWithIntl(<AuthForm mode="sign-in" />, { locale: "ko" });
    expect(screen.getByLabelText("사용자 이름 또는 이메일")).toHaveAttribute("autocomplete", "username");
    expect(screen.getByRole("link", { name: "회원 가입" })).toHaveAttribute("href", "/ko/sign-up");
  });
});

describe("sign out", () => {
  it("navigates only after the API clears the session", async () => {
    respondWith(new Response(null, { status: 204 }));
    const done = vi.fn();
    renderWithIntl(<SignOutButton onSuccess={done} />);
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(request).toHaveBeenCalledWith("/api/v1/auth/logout", { method: "POST" });
    expect(done).toHaveBeenCalledOnce();
  });
  it("keeps the account open when logout fails", async () => {
    respondWith(new Response(null, { status: 503 }));
    const done = vi.fn();
    renderWithIntl(<SignOutButton onSuccess={done} />);
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Access is temporarily unavailable. Please try again.");
    expect(done).not.toHaveBeenCalled();
  });
});
