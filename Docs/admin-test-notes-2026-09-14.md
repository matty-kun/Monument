# Admin Test Notes - 2026-09-14

Status: Original findings fixed and re-tested. Newly discovered database findings remain notes only.

## Resolution - 2026-09-14

- Team color mismatch: Fixed. Blue team names now use `#0a84ff` and the test passes.
- Blocking admin lint error: Fixed. The touched admin team files have zero lint errors.
- Public podium loader on admin routes: Fixed. The global podium fallback was removed and admin has its own loading state.
- Port 3001 failure: Diagnosed. Monument responds on `http://127.0.0.1:3001`; another Windows listener intercepts `http://localhost:3001` and returns 404.
- New team/new tournament error: Fixed. The invalid `upsert` against non-unique `departments.name` was replaced with lookup/create/link logic behind an authenticated admin server action.

See `Docs/admin-test-report-2026-09-14.md` for the complete test matrix and current findings.

## Confirmed Findings

### 1. Team color unit test fails

- Severity: Medium
- Check: `npm test`
- Location: `test/team-colors.test.mjs:9`
- Result: 7 of 8 tests passed.
- Failure: The test expects `#0a84ff`, but `teamNameToColor` returns `#269a7a`.
- Impact: The automated suite is red and the expected color behavior is out of sync with the implementation.

### 2. Admin lint does not pass

- Severity: Low
- Check: admin-scoped ESLint run
- Result: 1 error and 77 warnings.
- Blocking error: `src/features/admin/departments/viewModels/useDepartmentsViewModel.ts:81`
- Rule: `prefer-const`
- Detail: `finalUrls` is declared with `let` but is never reassigned.
- Notable warning groups: unused imports/state, explicit `any` types, unoptimized `<img>` elements, missing image alt text, effect-driven synchronous state updates, and React hook dependency/immutability warnings.

### 3. Admin routes briefly use the public podium loading state

- Severity: Medium
- Check: browser navigation to a protected admin route without an active admin session
- Route tested: `/admin/dashboard`
- Observed behavior: The page first renders `Loading standings` from the public podium experience, then redirects to the public page.
- Impact: Admin navigation can flash an unrelated public loading screen. It also makes authentication transitions look incorrect.

### 4. The development server on port 3001 returns 404

- Severity: High for local testing
- Check: browser navigation and direct HTTP health check
- URL: `http://localhost:3001/admin/dashboard`
- Result: The automated browser reports the page as blocked/unavailable, and direct requests to both `/` and `/admin/dashboard` return HTTP 404.
- Impact: Authenticated admin browser smoke tests cannot currently run against the requested development URL.
- Note: The production build served on port 3100 responds successfully, but its isolated browser session is not authenticated and redirects protected admin routes to the public page.

## Passing Checks

- TypeScript: Passed with no errors.
- Production build: Passed.
- Route compilation: All admin routes compiled successfully.
- Policy/unit tests passing: authorization, prediction policy, result policy, storage policy, stable fallback team colors, and tournament isolation.

## Admin Browser Coverage

The following authenticated workflows were not exercised because the test browser could not reach a working authenticated admin session on port 3001:

- Dashboard data rendering
- Tournament switching
- Result add/edit modal behavior
- Event add/edit and emoji modal behavior
- Schedule management
- Team, category, and venue management
- User administration
- Activity log filtering
- Settings changes

No records were created, edited, or deleted during this test pass.
