# Account deletion cannot orphan Organization billing

Account deletion is blocked while the User still has Organization Subscription obligations or is the sole Owner of an Organization that has not been closed or reassigned. We rejected tearing down billing on Account delete (stores may keep charging) and deferred “delete freely, leave the Organization running” until ownership-transfer UX is first-class. Safer default for the launchpad: clear blockers before erase.
