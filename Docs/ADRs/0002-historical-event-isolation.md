# ADR 0002: Historical Event Isolation

## Context
Different tournaments (e.g., CITE FEST vs. SIDLAK) will feature different line-ups of sports and categories. Future tournaments might omit certain sports or rename them.

## Decision
Events (the actual sports played) and Categories will be strictly tied to a specific `Tournament`. Instead of a global list of sports, each tournament will have its own snapshot/list of `TournamentEvent`s.

## Consequence
- The archive for CITE FEST 2026 will perfectly preserve its exact list of sports, even if those sports are deleted or modified for SIDLAK 2027.
- Admins will need a way to "clone" or copy a set of events from a previous tournament into a new one to save time when setting up a new season.
