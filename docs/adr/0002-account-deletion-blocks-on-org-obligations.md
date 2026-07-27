# Account deletion cannot orphan Organization billing

Account deletion is blocked while the User still has Organization Subscription obligations or is the sole Owner of an Organization that has not been closed or reassigned. We rejected tearing down billing on Account delete (stores may keep charging). Ownership transfer is available in the Organizations UI (promote another member to owner, then demote yourself) so sole-owner leave and Account delete blockers can be cleared without orphaning billing. Safer default for the launchpad: clear blockers before erase.
