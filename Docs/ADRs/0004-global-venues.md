# ADR 0004: Global Venues

## Context
Tournaments require scheduling games at physical locations (venues).

## Decision
The `venues` table will remain global and will not be snapshotted per tournament. Multiple tournaments can reference the same venue records.

## Consequence
- Simplified venue management for admins.
- If a venue's name changes permanently, it will retroactively update the name for archived tournaments that referenced it. (Considered acceptable since physical location identities rarely change significantly).
