# WI-0906 Employee Bulk Import

## Scope
- Added admin-only bulk employee import API:
  - `POST /api/people/employees/bulk-import`
  - file: `src/app/api/people/employees/bulk-import/route.ts`
- Added admin UI panel for CSV text bulk import:
  - file: `src/components/people/BulkImportPanel.tsx`
  - connected into admin people workspace layout:
    - file: `src/app/admin/people/page-view-layout.tsx`
- Added end-to-end test:
  - `scripts/tests/e2e-wi0906-bulk-import.test.ts`

## API Behavior
- Auth guard:
  - Uses `readActor(request)` and allows only `actor.role === "admin"`.
  - Non-admin callers return `403`.
- Input:
  - JSON body with `employees` array.
  - row schema: `name`, `email`, `departmentId`, `positionId`, `hireDate`.
- Processing:
  - Iterates rows and calls `dataAccess.employees.create(...)` for each row.
  - Generates unique employee IDs per row.
  - Validates `hireDate` with `YYYY-MM-DD`.
- Output:
  - `{ imported, failed, errors }`

## UI Behavior
- Added a CSV text area panel on `/admin/people`.
- Accepts rows in:
  - `name,email,departmentId,positionId,hireDate`
- `가져오기` button posts parsed rows to `/api/people/employees/bulk-import`.
- Displays response summary:
  - imported count
  - failed count
  - errors list
- Added header action button to jump to the bulk import panel.

## E2E Scenario
1. Memory setup:
   - create organization, department, position
2. Admin bulk import:
   - submit 3 employee rows
   - assert `imported=3`, `failed=0`
3. Employee list verification:
   - call `GET /api/people/employees`
   - assert 3 employees exist
4. Negative case:
   - employee actor calls bulk import
   - assert `403`

## Verification
- `npm.cmd run typecheck`
- `npm.cmd run lint`
