# ADR 0001: Historical Team Identities (Snapshots)

## Context
The system is migrating to a multi-tournament architecture. A Department (e.g., CITE, CBA, CED, CAS, CCJE) might change its mascot or team name in future years. 

## Decision
We will separate the base `Department` from its tournament-specific representation. When a Department enters a Tournament, we create a snapshot of its identity (name, abbreviation, mascot) for that specific tournament.

## Consequence
- The archive of CITE FEST 2026 will always preserve the exact team identities and mascots as they were in 2026.
- Queries for leaderboards will need to fetch team metadata from the tournament snapshot rather than a global department table.
- Admins will need a way to "import" or copy base departments into a new tournament and modify their mascots for that season if needed.
