import { describe, expect, it, vi } from "vitest";

import { createIdentityAuthPlugins } from "../../src/lib/better-auth/identity-auth";
import {
  applyOrganizationAuthAdapter,
  createOrganizationAuthPlugins,
} from "../../src/lib/better-auth/organization-auth-adapter";

describe("auth composition", () => {
  it("identity plugins are Expo-only (no organization)", () => {
    const plugins = createIdentityAuthPlugins();
    const ids = plugins.map((plugin) => plugin.id);
    expect(ids).toContain("expo");
    expect(ids).not.toContain("organization");
  });

  it("organization adapter adds organization plugin and personal-org hooks", () => {
    const identity = {
      plugins: createIdentityAuthPlugins(),
    };
    const createOrganizationRef = { current: null };
    const db = {
      query: {
        member: {
          findFirst: vi.fn(),
        },
      },
      select: vi.fn(),
    };

    const composed = applyOrganizationAuthAdapter(identity, {
      env: {
        EMAIL_PROVIDER: "console",
        EMAIL_FROM: "test@example.com",
      } as never,
      appUrl: "http://127.0.0.1:8081",
      db: db as never,
      createOrganizationRef,
    });

    const ids = (composed.plugins ?? []).map((plugin) => plugin.id);
    expect(ids).toContain("expo");
    expect(ids).toContain("organization");
    expect(composed.databaseHooks?.user?.create?.after).toBeTypeOf("function");
    expect(composed.databaseHooks?.session?.create?.before).toBeTypeOf("function");
  });

  it("organization plugin factory is usable without applying the full adapter", () => {
    const plugins = createOrganizationAuthPlugins(
      {
        EMAIL_PROVIDER: "console",
        EMAIL_FROM: "test@example.com",
      } as never,
      "http://127.0.0.1:8081",
    );
    expect(plugins.map((plugin) => plugin.id)).toEqual(["organization"]);
  });
});
