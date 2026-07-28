# Context Map

## Contexts

- [Product (RN CF Launchpad)](./CONTEXT.md): Users, Organizations, Subscriptions, Entitlements — the B2C product language.
- [Agent operating model](./.agents/CONTEXT.md): How coding agents contract, route, and collaborate in this repository.

## Relationships

- **Product ← Agent**: Agents must use product terms from root `CONTEXT.md` when editing domain code or docs. Agent-context terms never replace product nouns (e.g. do not call an Organization a “workspace” in product code because a Playbook said “workspace”).
- **Agent ← Product**: Playbooks may _point at_ product docs and skills; they do not redefine User, Organization, or Entitlement.
