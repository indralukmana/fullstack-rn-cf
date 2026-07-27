import { describe, expect, it } from "vitest";

import {
  personalOrganizationName,
  personalOrganizationSlug,
} from "../../src/lib/better-auth/personal-organization";

describe("personal organization helpers", () => {
  it("names an organization from the user display name", () => {
    expect(personalOrganizationName("Ada Lovelace")).toBe("Ada Lovelace's organization");
    expect(personalOrganizationName("  ")).toBe("Personal organization");
  });

  it("builds a stable unique slug from name and user id", () => {
    expect(personalOrganizationSlug({ id: "user_ABC-123", name: "Ada Lovelace" })).toBe(
      "ada-lovelace-userabc123",
    );
  });
});
