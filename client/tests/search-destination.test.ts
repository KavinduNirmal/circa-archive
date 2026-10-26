import { beforeEach, expect, it, vi } from "vitest";
import { sessionFetch } from "@/lib/auth/session";
import { getArchiveDestination } from "@/lib/search/destination";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ sessionFetch: vi.fn() }));
const destination = {
  id: "id",
  type: "incident",
  code: "INC-008000",
  title: "API incident",
  markdown: "API body",
  access: "public",
  requestStatus: null,
  rumours: [],
};
beforeEach(() => vi.mocked(sessionFetch).mockReset());
it("fetches real destinations with no cache and forwards explicit acknowledgment", async () => {
  vi.mocked(sessionFetch).mockResolvedValue(Response.json(destination));
  expect(await getArchiveDestination(destination.code, true)).toEqual({
    status: "success",
    destination,
  });
  expect(sessionFetch).toHaveBeenCalledWith(
    "/api/v1/archive/INC-008000?acknowledge=true",
    expect.objectContaining({ cache: "no-store" }),
  );
});
it("distinguishes missing entries from outages and rejects malformed payloads", async () => {
  vi.mocked(sessionFetch).mockResolvedValue(
    new Response(null, { status: 404 }),
  );
  expect(await getArchiveDestination("EXP-008000")).toEqual({
    status: "missing",
  });
  vi.mocked(sessionFetch).mockResolvedValue(
    new Response(null, { status: 503 }),
  );
  expect(await getArchiveDestination("EXP-008000")).toEqual({
    status: "error",
  });
  vi.mocked(sessionFetch).mockResolvedValue(
    Response.json({ markdown: "wrong" }),
  );
  expect(await getArchiveDestination("EXP-008000")).toEqual({
    status: "error",
  });
});
it("rejects sealed incident bodies without acknowledgment", async () => {
  vi.mocked(sessionFetch).mockResolvedValue(
    Response.json({ ...destination, access: "sealed" }),
  );
  expect(await getArchiveDestination(destination.code)).toEqual({
    status: "error",
  });
});
