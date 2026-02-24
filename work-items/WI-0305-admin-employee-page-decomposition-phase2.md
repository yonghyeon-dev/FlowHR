# WI-0305: Admin/Employee Page Decomposition Phase 2

## Background

`src/app/admin/page.tsx` and `src/app/employee/page.tsx` were still large after phase1
helper extraction. The remaining size came mostly from inlined JSX panel blocks.

## Scope

- `src/app/admin/page.tsx`
  - Extract major page panels into dedicated dashboard components:
    - chrome(header/warning/KPI)
    - onboarding/account
    - people/invite
    - scheduling
    - aggregates/leave-policy
    - payroll
    - debug logs
  - Rewire page to render extracted components with existing state/handler props.
- `src/app/employee/page.tsx`
  - Extract major page panels into dedicated dashboard components:
    - chrome(header/warning/KPI)
    - account + integrated summary/checklist
    - request feedback/search/timeline
    - resubmit flow
  - Rewire page to render extracted components with existing state/handler props.
- Locale/UI cleanup while extracting:
  - Fix broken pending wait label text in request search list
    (`?? ${Math.round(row.pendingHours)}??` -> locale-aware `대기 ...시간` / `pending ...h`).

## Out of Scope

- API/contract/schema changes
- New product functionality
- Business rule changes

## Acceptance

1. Admin/employee page panel JSX is decomposed into reusable component files.
2. `admin/page.tsx` and `employee/page.tsx` line counts decrease with behavior preserved.
3. Broken pending wait label text is removed and replaced with locale-aware copy.
4. Typecheck/build/regression checks pass.

## Notes

- Related issue: `#379`
- Refactor/UI decomposition WI (no contract version bump required)
