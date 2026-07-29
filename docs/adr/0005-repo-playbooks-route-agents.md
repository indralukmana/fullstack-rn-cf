# Repo Playbooks route agents; host plugins stay optional

This launchpad splits **product** language (`CONTEXT.md`) from **agent operating** language
(`.agents/CONTEXT.md`) via `CONTEXT-MAP.md`. Non-trivial work is routed by the
`launchpad-orchestrate` skill to thin Playbooks under `.agents/playbooks/` that name Skills and
Subagent gates and point at Recipes in docs — they do not duplicate runbooks. We rejected
vendor-specific contract shims and requiring personal host orchestration plugins so clones work
from the repo Contract alone. `launchpad-architecture` remains the invariants skill; Playbooks
load it when the task needs it.
