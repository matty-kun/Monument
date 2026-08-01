# ADR 0005: Tournament-Specific Settings

## Context
The application uses configuration flags like `mystery_mode` to control UI state (e.g., hiding scores until a reveal).

## Decision
Settings like `mystery_mode` will be migrated from a global `app_settings` table to be properties of the `tournaments` table itself (or a tournament-specific settings table). 

## Consequence
- The "Archive" of CITE FEST 2026 can remain fully visible (mystery mode OFF), while the ongoing SIDLAK 2026 tournament can have mystery mode ON to build suspense.
- The Admin UI must be updated so that toggling settings applies only to the currently selected tournament.
