import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("shadcn class composition", () => {
  it("accepts conditional classes and keeps the final conflicting utility", () => {
    expect(cn("px-2", false, { "font-bold": true }, "px-4")).toBe("font-bold px-4");
  });
});
