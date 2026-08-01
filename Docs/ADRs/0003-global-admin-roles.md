# ADR 0003: Global Admin Roles

## Context
With the introduction of multiple tournaments (CITE FEST, SIDLAK, CBA FEST), we need to determine if administrative permissions should be granular (per-tournament) or global.

## Decision
Admins will remain Global. Any user with the `admin` or `super_admin` role will have the authority to manage data across all tournaments in the system.

## Consequence
- Simplified role management.
- The `profiles` table does not need to be updated to support tournament-specific permissions.
- Admins must be careful to select the correct tournament from the UI before making edits to ensure they don't accidentally modify an archived tournament.
