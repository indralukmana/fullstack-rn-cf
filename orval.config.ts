import { defineConfig } from "orval";

export default defineConfig({
  rnCf: {
    input: {
      target: "./packages/api-client/openapi.json",
    },
    output: {
      mode: "tags-split",
      target: "./packages/api-client/src/generated",
      schemas: "./packages/api-client/src/generated/models",
      client: "react-query",
      httpClient: "fetch",
      clean: true,
      mock: {
        indexMockFiles: true,
        generators: [{ type: "msw" }, { type: "faker" }],
      },
      override: {
        mutator: {
          path: "./packages/api-client/src/mutator.ts",
          name: "customFetch",
        },
      },
    },
  },
});
