# Admin Test Report - 2026-09-14

## Result

The reported new-team failure is fixed. The form previously used `upsert(..., { onConflict: "name" })`, but the live `departments` table has no unique constraint on `name`. Team create, edit, delete, and import now run through authenticated admin server actions and remain scoped to the selected tournament.

## Test Matrix

| Type | Status | Coverage |
| --- | --- | --- |
| Unit | Pass | Team validation, team colors, authorization, result and prediction rules |
| Integration | Pass | Live Supabase schema contract read; confirmed department and tournament-team constraints |
| End-to-end | Partial pass | Browser verified protected admin navigation redirects correctly without leaking the podium loader; authenticated data mutation was not run against production data |
| Regression | Pass | New tournament team creation no longer depends on a nonexistent unique-name constraint |
| Smoke | Pass | Public and protected routes respond on `127.0.0.1:3001`; production build compiles every route |
| Acceptance | Pass | Admin owns its loading state; team payload is normalized and tied to a selected tournament |
| Performance | Pass with baseline | Eight development requests: 551 ms minimum, 645 ms median, 1,758 ms maximum |
| Security | Code pass; database findings open | Team writes require an admin before elevated access; Supabase advisor findings are listed below |
| Snapshot | Pass | Normalized team payload baseline is stable |
| Contract | Pass | Application payload keys match `name`, `abbreviation`, and `image_url`; live membership uniqueness is `(tournament_id, department_id)` |

## Automated Results

- `npm test`: 15 passed, 0 failed.
- `npm run test:admin`: 10 passed, 0 failed.
- ESLint: 0 errors. Existing non-blocking warnings remain outside this focused fix.
- TypeScript: Passed.
- Production build: Passed.
- Browser acceptance: Passed for unauthenticated redirect and loading-state isolation.

## Open Security Findings - Not Changed

Supabase's advisor reports row-level security disabled on nine public tables: `announcements`, `departments`, `profiles`, `categories`, `venues`, `schedules`, `events`, `tournaments`, and `tournament_departments`. This means direct Data API access may bypass the application's admin controls.

It also reports that `public.handle_new_user()` is a callable `SECURITY DEFINER` function for anonymous and signed-in roles, five functions have mutable search paths, and leaked-password protection is disabled.

These were recorded only. Enabling RLS without a complete policy set could break the public scoreboard, so the database needs a dedicated policy migration and verification pass.

## Open Performance Findings - Not Changed

Supabase reports 11 foreign keys without covering indexes and two `app_settings` policies that repeatedly evaluate auth functions. These are optimization tasks, not blockers for the team fix.

## Environment Note

Use `http://127.0.0.1:3001` for local testing. On this machine, `http://localhost:3001` is currently claimed by an additional listener and returns 404 even while Monument itself is healthy.
