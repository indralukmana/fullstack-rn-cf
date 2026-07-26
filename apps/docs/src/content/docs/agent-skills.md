---
title: Agent skills
description: Project-scoped vendor knowledge and launchpad architecture context
---

The repository commits project-scoped Agent Skills under `.agents/skills`. Cursor, Codex, OpenCode,
and other compatible agents discover only skill metadata initially and load full instructions when
a task matches, keeping normal context small.

## Installed sources

| Source                   | Scope                                                                  |
| ------------------------ | ---------------------------------------------------------------------- |
| Cloudflare               | Workers, production practices, Wrangler, Cloudflare Email Service      |
| Expo                     | Router, project structure, data, dev clients, upgrades, EAS operations |
| RevenueCat               | Integration, identity, purchase/restore, Customer Center, testing      |
| Stripe                   | Billing/security practices, documentation lookup, SDK/API upgrades     |
| Better Auth              | Core/security, email-password, and organization guidance               |
| Uniwind                  | Tailwind CSS v4 styling and troubleshooting for React Native           |
| UI polish (ibelick)      | `baseline-ui`, `improve-ui`, `create-design-md`, accessibility fixes   |
| Frontend UI engineering  | Structure and interaction quality (Addy Osmani)                        |
| Accessibility            | WCAG-oriented audits for interactive surfaces                          |
| Varlock                  | Secret-safe schema, validation, and environment workflows              |
| Orval                    | OpenAPI-generated fetch, TanStack Query, MSW, and Faker clients        |
| Hono creator skill       | Routing, middleware, Worker runtime, and request testing               |
| Drizzle ORM              | Schema, queries, and Kit workflows (D1/RQB v2 overrides in launchpad)  |
| `launchpad-architecture` | Repository-specific invariants and conflict resolution                 |

Product visual intent for the Expo app lives in `apps/app/DESIGN.md`. Generic UI skills must
follow that file and Uniwind constraints.

### UI skill overrides (Expo / Uniwind)

Vendor UI skills (`baseline-ui`, `improve-ui`, `frontend-ui-engineering`, `fixing-accessibility`)
often assume DOM stacks (Base UI / Radix, `motion/react`, `text-balance`, CSS Grid dashboards).
For `apps/app`, prefer:

- Uniwind + React Native primitives (`Pressable`, `TextInput`, `Modal`) from
  `apps/app/components/ui.tsx`
- Semantic theme tokens in `apps/app/global.css` (not purple/glow marketing kits)
- RN accessibility props (`accessibilityLabel`, `accessibilityRole`) alongside web ARIA where
  Expo web maps them
- No NativeWind, shadcn/Next layout kits, or DOM-only animation libraries on shared screens

When a vendor UI example conflicts with `DESIGN.md` or `launchpad-architecture`, keep the
launchpad pattern and note the conflict instead of copying the web-only recipe.

The source and content hash for downloaded skills are recorded in `skills-lock.json`. The
launchpad skill is maintained locally because no vendor skill knows the unified billing ledger,
code-generation boundary, D1 migration policy, or release gates.

## Precedence

Apply instructions in this order:

1. User request and safety/approval boundaries.
2. Root and nearest workspace `AGENTS.md`.
3. `.cursor/rules` and `launchpad-architecture`.
4. Vendor skills for current product APIs.
5. Generic model knowledge.

This matters when a generic skill conflicts with the template. RevenueCat client state cannot
authorize the API, Expo API routes do not replace the Hono Worker, NativeWind guidance does not
apply to Uniwind, and store/deploy commands still require explicit approval.

## Restore and update

Restore downloaded skills from the lock file after cloning:

```bash
npx skills@latest experimental_install
```

Inspect upstream changes before updating:

```bash
npx skills@latest update --project
git diff -- .agents/skills skills-lock.json
```

Skills execute with the agent's permissions. Review changed instructions, references,
`allowed-tools`, scripts, network calls, deployment commands, and secret handling before
committing an update. Never auto-merge skill updates.

After installation or updates, restart or refresh the agent session so discovery metadata is
reloaded.
