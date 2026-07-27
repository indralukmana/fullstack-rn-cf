import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyReplacements,
  buildProductIdentity,
  buildReplacements,
  schemeFromSlug,
  slugifyName,
} from "./productize-lib.mjs";

describe("productize helpers", () => {
  it("slugifies display names", () => {
    assert.equal(slugifyName("Acme Learn"), "acme-learn");
  });

  it("derives Expo schemes from slugs", () => {
    assert.equal(schemeFromSlug("acme-learn"), "acmelearn");
  });

  it("builds identity defaults from name and slug", () => {
    assert.deepEqual(
      buildProductIdentity({
        name: "Acme Learn",
        slug: "acme-learn",
      }),
      {
        name: "Acme Learn",
        slug: "acme-learn",
        scheme: "acmelearn",
        bundleId: "com.example.acmelearn",
        apiWorker: "acme-learn-api",
        webPages: "acme-learn-web",
        docsPages: "acme-learn-docs",
        d1Name: "acme-learn",
        billingQueue: "acme-learn-billing-events",
        billingDlq: "acme-learn-billing-events-dlq",
        serviceName: "acme-learn-api",
      },
    );
  });

  it("preserves @rn-cf package scopes while renaming product tokens", () => {
    const replacements = buildReplacements(
      buildProductIdentity({
        name: "Acme Learn",
        slug: "acme-learn",
        scheme: "acmelearn",
        bundleId: "com.acme.learn",
      }),
    );
    const source = JSON.stringify(
      {
        name: "@rn-cf/app",
        deploy: "wrangler pages deploy dist --project-name=rn-cf-web",
        scheme: "rncf",
        title: "RN CF",
      },
      null,
      2,
    );
    const next = applyReplacements(source, replacements);
    assert.match(next, /"name": "@rn-cf\/app"/);
    assert.match(next, /project-name=acme-learn-web/);
    assert.match(next, /"scheme": "acmelearn"/);
    assert.match(next, /"title": "Acme Learn"/);
  });
});
