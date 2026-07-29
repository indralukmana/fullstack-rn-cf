import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://docs.rn-cf.example",
  output: "static",
  server: { port: 4321 },
  integrations: [
    starlight({
      title: "RN CF Docs",
      editLink: {
        baseUrl: "https://github.com/indralukmana/fullstack-rn-cf/-/edit/main/apps/docs/",
      },
      sidebar: [
        { label: "Getting Started", slug: "getting-started" },
        { label: "Derive a Product", slug: "derive-a-product" },
        { label: "Domain Language", slug: "domain" },
        { label: "Environment Configuration", slug: "environment" },
        { label: "Agent Guardrails", slug: "agent-guardrails" },
        { label: "Agent Skills", slug: "agent-skills" },
        { label: "Architecture", slug: "architecture" },
        { label: "Authentication", slug: "auth" },
        { label: "Billing", slug: "billing" },
        { label: "Billing Operations", slug: "billing-operations" },
        { label: "Native Release", slug: "native-release" },
        { label: "Launch Checklist", slug: "launch-checklist" },
        { label: "Security", slug: "security" },
        { label: "API Reference", slug: "api-reference" },
        { label: "Testing", slug: "testing" },
        { label: "CI/CD", slug: "ci-cd" },
        { label: "Deployment", slug: "deployment" },
        { label: "Contributing", slug: "contributing" },
        {
          label: "ADRs",
          items: [
            {
              label: "0001 Organization owns subscription",
              slug: "adr/0001-organization-owns-subscription",
            },
            {
              label: "0002 Account deletion blockers",
              slug: "adr/0002-account-deletion-blocks-on-org-obligations",
            },
            {
              label: "0003 Provider customers → Organization",
              slug: "adr/0003-provider-customers-map-to-organization",
            },
            {
              label: "0004 Organization close blockers",
              slug: "adr/0004-organization-close-blocked-on-subscription",
            },
            {
              label: "0005 Repo Playbooks route agents",
              slug: "adr/0005-repo-playbooks-route-agents",
            },
          ],
        },
      ],
    }),
  ],
});
