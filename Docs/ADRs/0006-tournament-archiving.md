# ADR 0006: Tournament Archiving & Read-Only States

## Status
Accepted

## Context
As seasons conclude, there needs to be a mechanism to officially "End" a tournament. When a tournament ends, it should be removed from the active public view and transitioned into a historical archive. Furthermore, to preserve data integrity, archived tournaments must be protected from accidental modification.

## Decisions

1. **Tournament Status Tracking:**
   - We will add an `is_archived` boolean column (default `false`) to the `tournaments` table. 
   - A tournament can be `is_active = true` (the current live tournament) or `is_active = false`. 
   - If a tournament is explicitly ended, it becomes `is_active = false` and `is_archived = true`.

2. **Public View Behavior:**
   - If there is no active tournament (e.g., between seasons) and the user has not explicitly navigated to an archive via the `?tournament=` URL parameter, the public `/` page will display a beautiful fallback screen featuring just the Monument logo and name.

3. **Read-Only Enforcement:**
   - When an admin selects an `is_archived = true` tournament in their dashboard context, the UI will shift into a "Read-Only Mode".
   - In Read-Only mode, all creation, modification, and deletion actions (buttons, forms, and destructive modals) will be hidden or disabled across all admin pages (Events, Teams, Results, Schedule).

4. **Trigger Mechanism:**
   - The action to "Archive" a tournament will be placed in the `admin/tournaments` (or Settings) management page. It will require a confirmation modal to prevent accidental archiving.

## Consequences
- Data integrity for past intramurals is guaranteed at the UI level.
- The public experience between seasons is clean and branded.
- Requires updating multiple admin pages to respect the `is_archived` state.
