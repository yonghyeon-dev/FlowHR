# FlowHR Production Gap Inventory

Last updated: 2026-03-09
Purpose: track the full production gap set in one place and map each gap to an existing WI or a new execution bundle.

Legend:

- `Existing`: already tracked in a WI and needs execution or re-verification.
- `New`: no suitable WI existed; a new bundle WI was created.
- `Partial`: related WI exists, but current product gap is broader than the earlier implementation.

## A. User-Facing Developer Trace And Technical Language

| Ref | Surface | Current | Desired | Status |
| --- | --- | --- | --- | --- |
| 1 | Approval queue title | Raw domain tag and CUID visible | Human-readable title with actor and request type | New -> WI-1053 |
| 2 | Approval queue reason | Test data and technical wording visible | Actual employee-written reason | New -> WI-1053 |
| 3 | Employee profile | CUIDs shown for employee/department/position/org | Human-readable org profile labels, no org ID leak | New -> WI-1053 |
| 4 | Admin people history panel | Selected employee CUID visible | Employee name and recognizable profile label | New -> WI-1053 |
| 5 | Admin people compare panel | CUID in compare header | Employee names | New -> WI-1053 |
| 6 | Admin reports table | `employeeId` exposed | Employee name plus department/team label | New -> WI-1053 |
| 7 | Employee people status | Raw enum such as `ACTIVE` | Korean employment status label | New -> WI-1053 |
| 8 | Approval escalation entity type | `AttendanceRecord`, `LeaveRequest` placeholders | Product request-type wording | New -> WI-1053 |
| 9 | Approval escalation entity ID | Raw entity ID field shown | Hidden or business request number | New -> WI-1053 |
| 10 | Audit logs | Raw entity type and entity ID filters | Human-readable target and action wording | New -> WI-1053 |
| 11 | Notifications list | `notification.type` enum shown | Korean notification type label | New -> WI-1053 |
| 12 | Audit log date filter | ISO timestamp shown | User locale date/time | New -> WI-1053 |
| 13 | Escalation webhook timestamp | ISO timestamp shown | User locale date/time | New -> WI-1053 |
| 30 | Service errors | Technical error text such as actor-context failure | Localized recovery guidance | New -> WI-1053 |

## B. External Notification Productization

| Ref | Surface | Current | Desired | Status |
| --- | --- | --- | --- | --- |
| 14 | Escalation webhook | `organizationId` exposed | Hidden internal metadata | New -> WI-1054 |
| 15 | Escalation webhook | Raw IDs, enums, stalled-hour payload lines | Human-readable actor, item, stalled state | New -> WI-1054 |
| 16 | Escalation webhook | `notificationChannel` label exposed | Hidden internal routing label | New -> WI-1054 |
| 17 | Escalation webhook | No approval action link | Direct operator action link | New -> WI-1054 |
| 18 | Leave-promotion webhook | Employee code and english-like payload formatting | Human-readable employee, balance, eligibility wording | New -> WI-1054 |

## C. Admin Operational Controls Missing From Product UI

| Ref | Surface | Current | Desired | Status |
| --- | --- | --- | --- | --- |
| 19 | Discord/Slack webhook config | Env-only | Admin settings integration tab | New -> WI-1055 |
| 20 | Escalation policy thresholds | Env-only | Admin settings approval tab | New -> WI-1055 |
| 21 | Email notification settings | Env-only | Admin settings notifications tab | New -> WI-1055 |
| 22 | Feature flags | Env-only | Admin feature management or explicit ops-only isolation | New -> WI-1055 |
| 23 | Leave policy management | API exists, no real admin CRUD product surface | Admin leave-policy management UI | Partial -> WI-1055 |
| 24 | Employee notification settings | localStorage only | Durable server persistence plus admin defaults | Partial -> WI-1055 |
| 25 | Attendance security settings | Env-only GPS/geofence controls | Admin settings attendance-security tab | Partial -> WI-1055 |

## D. UX, Feedback, And Dev-Remnant Cleanup

| Ref | Surface | Current | Desired | Status |
| --- | --- | --- | --- | --- |
| 26 | Employee dashboard | Dev log surface still visible in product mode | Fully hidden in production mode | New -> WI-1056 |
| 27 | Payslips | Raw JSON payload copied | User summary copy or no raw payload copy | New -> WI-1056 |
| 28 | Admin people profile update | Immediate action without confirmation | Confirmation dialog before commit | New -> WI-1056 |
| 29 | Notification read action | No feedback | Success toast or inline confirmation | New -> WI-1056 |

## E. Core Journey Reliability And IA

| Ref | Surface | Current | Desired | Status |
| --- | --- | --- | --- | --- |
| J1 | Employee focus deep links | Desktop direct-load gaps remained across focus targets | Stable direct-load and client-side section navigation | Existing -> WI-1033, WI-1034, WI-1035, WI-1036, WI-1043, WI-1045, WI-1048 |
| J2 | Admin approvals hash | `/admin#approvals` was unreliable | Stable redirect or stable target section | Existing -> WI-1038, WI-1044, WI-1049 |
| J3 | Notice create | `publishAt` mismatch caused 400 | Immediate and scheduled create both succeed | Existing -> WI-1042, WI-1050 |
| J4 | Admin org/tenant context | Org lookup failures and claim mismatch | Stable tenant context in production | Existing -> WI-1025, WI-1026, WI-1051 |
| J5 | Notifications auth | Missing auth header caused 401 | Stable authenticated notification reads | Existing -> WI-1016, WI-1023 |
| J6 | Approval executions hydration | Runtime hydration error | Stable page render in production | Existing -> WI-1024 |
| J7 | Mobile payslip anchor | Broken `#payslip-search-sort` anchor | Stable mobile anchor entry | Existing -> WI-1037 |
| J8 | Positions page heading | English heading in Korean surface | Korean heading | Existing -> WI-1039 |
| J9 | Contracts bootstrap | First-load 401 followed by success | No unauthorized bootstrap request | New -> WI-1057 |
| J10 | Year-end and filing workflows | Current `409` conflicts block production trust | Recoverable and user-guided year-end flows | New -> WI-1058 |

## F. Current Execution Order

1. WI-1053 user-facing developer trace and terminology cleanup
2. WI-1057 contracts bootstrap race recovery
3. WI-1058 year-end and filing conflict recovery
4. WI-1054 external operator notification productization
5. WI-1055 admin operational settings productization
6. WI-1056 UX and dev-remnant cleanup
