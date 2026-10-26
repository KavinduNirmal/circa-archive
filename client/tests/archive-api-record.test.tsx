import { expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArchiveApiRecord } from "@/components/archive-site/archive-api-record";
import { RecordAccessRequest } from "@/components/archive-site/record-access-request";
import { authFetch } from "@/lib/auth/client";
import { renderWithIntl } from "./intl";
vi.mock("@/lib/auth/client", () => ({
  authFetch: vi.fn(),
  SignedOutError: class extends Error {},
}));
vi.mock("@/components/archive-site/archive-chrome", () => ({
  ArchiveChrome: ({ children }: { children: React.ReactNode }) => children,
}));
const destination = {
  id: "incident",
  type: "incident" as const,
  code: "INC-008000",
  title: "Real incident",
  markdown: null,
  access: "sealed" as const,
  requestStatus: null,
  rumours: [],
};
it("offers a GET acknowledgment for incidents and no access request", () => {
  renderWithIntl(<ArchiveApiRecord destination={destination} />);
  const button = screen.getByRole("button", { name: "Acknowledge and reveal" });
  expect(button.closest("form")).toHaveAttribute("method", "get");
  expect(button).toHaveAttribute("name", "acknowledge");
  expect(
    screen.queryByRole("button", { name: "Request access" }),
  ).not.toBeInTheDocument();
});
it("renders approved record prose and real rumour anchors", () => {
  renderWithIntl(
    <ArchiveApiRecord
      destination={{
        ...destination,
        markdown: "Public prose",
        access: "public",
        rumours: [
          {
            ...destination,
            id: "rumour",
            type: "record",
            code: "rumour-7",
            title: "RUM 7",
            markdown: "Rumour prose",
            access: "public",
          },
        ],
      }}
    />,
  );
  expect(screen.getByText("Rumour prose").closest("section")).toHaveAttribute(
    "id",
    "rumour-7",
  );
});
it("submits one access request and shows the pending state", async () => {
  vi.mocked(authFetch).mockResolvedValue(Response.json({ status: "pending" }));
  const user = userEvent.setup();
  renderWithIntl(
    <RecordAccessRequest
      code="EXP-300000"
      initialStatus={null}
      labels={{
        request: "Request access",
        pending: "Pending approval",
        denied: "Denied",
        expired: "Expired",
        error: "Try again",
        signIn: "Sign in",
      }}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Request access" }));
  expect(authFetch).toHaveBeenCalledWith(
    "/api/v1/archive/EXP-300000/access-requests",
    { method: "POST" },
  );
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Pending approval",
  );
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
