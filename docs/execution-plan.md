# FlowHR Execution Plan (Priority-Driven)

Date: 2026-02-13  
Goal: Keep contract-first delivery speed while preserving merge/release safety for a 1-person operator model.

## 1) Current Baseline

Completed:

- Governance scaffold is in place (`docs`, `specs`, `contracts`, `qa`, `.github`).
- Branch protection is active on `main` with required checks (`contract-governance`, `quality-gates`, `golden-regression`).
- PR template, CODEOWNERS, RACI, break-glass, data ownership, and QA gate documents are applied.
- Contract governance check is hardened to YAML parse + JSON schema + versioning rules.
- WI-0001 vertical slice is implemented:
  - attendance record/create/update/approve
  - payroll preview/confirm
  - audit logs and memory/prisma e2e coverage
- WI-0002 leave slice is implemented:
  - request/update/approve/reject/cancel
  - leave balance read model
  - memory/prisma e2e coverage
- WI-0003 leave accrual/carry-over settlement is implemented:
  - accrual settlement API and duplicate-year guard
  - carry-over policy fields and migration
  - memory/prisma e2e coverage
- WI-0006 deduction profile runtime contract is drafted:
  - payroll contract v1.2.0 with profile mode and API/event/db deltas
  - ADR-0002 and WI-0006 template finalized
  - golden scenario `GC-006` defined
- WI-0006 deduction profile runtime is implemented:
  - deduction profile GET/PUT API and audit/event emission
  - phase2 preview `manual/profile` mode with profile trace persistence
  - memory/prisma e2e coverage added
- WI-0007 MVP operations console is implemented:
  - single-screen flow execution for attendance/payroll/leave/profile APIs
  - API response log panel for manual verification
  - mobile-compatible layout and build validation
- WI-0008 state transition hardening is implemented:
  - duplicate attendance approval blocked (409)
  - duplicate payroll confirmation blocked (409)
  - memory/prisma e2e assertions added
- WI-0009 attendance rejection flow is implemented:
  - `POST /attendance/records/{recordId}/reject` added for admin/manager
  - rejected attendance excluded from payroll aggregation path
  - memory/prisma e2e assertions added
- WI-0010 payroll profile version guard is implemented:
  - profile-mode preview accepts optional `expectedProfileVersion`
  - stale profile version requests are blocked with `409`
  - memory/prisma e2e assertions added
- WI-0011 alert workflow hardening is implemented:
  - webhook failure notifications unified via `scripts/ops/notify-slack-failure.mjs`
  - production failure workflows switched from inline curl to common notifier
  - manual `alert-webhook-smoke` workflow added for webhook connectivity check
- WI-0013 alert webhook provider expansion is implemented:
  - notifier supports Discord and Slack webhook payloads
  - production workflows read `FLOWHR_ALERT_DISCORD_WEBHOOK` first, then Slack fallback
  - webhook smoke gate validates configured alert channel regardless of provider
- WI-0014 alert webhook regression tests are implemented:
  - notifier payload/guard/failure paths covered by `ops-alert-webhook.test.ts`
  - `test:integration` now includes alert webhook regression test
  - CI quality gate blocks notifier regression before merge
- WI-0015 event governance traceability check is implemented:
  - `check_traceability.py` now validates runtime/contract/data-ownership event alignment
  - runtime event names must be represented in contracts and ownership matrix
  - invalid/unknown published event names are blocked by CI
- WI-0016 attendance rejection reason traceability is implemented:
  - reject API accepts optional `reason` payload with schema validation
  - `attendance.rejected` audit/event payload now preserves rejection reason
  - memory/prisma WI-0001 e2e asserts rejection reason traceability
- WI-0017 attendance reject validation guards are implemented:
  - reject API invalid JSON and oversized reason paths are covered by memory/prisma e2e
  - invalid reject payloads are asserted as `400` without audit/event side effects
  - attendance contract/test-cases include validation guard expectations
- Golden fixtures (`GC-001` to `GC-006`) are validated in CI and executable tests.
- Supabase role claim governance script exists (`dry-run`, `apply`, `enforce`).
- Staging Prisma integration is enabled with schema isolation guardrails.
- Production runtime flag is active (`FLOWHR_PAYROLL_DEDUCTIONS_V1=true`) on GitHub env and Vercel.
- Production profile flag baseline is synced (`FLOWHR_PAYROLL_DEDUCTION_PROFILE_V1=false`) on GitHub env and Vercel.

Open gaps:

- none blocking for current MVP+ hardening scope

## 2) Priority Roadmap

## P0. Governance Guardrails (Completed)

Objective: make unsafe changes unmergeable.

Delivered:

1. Required status checks + branch protection.
2. Contract/version gate + golden fixture gate.
3. PR checklist and break-glass policy.

Definition of Done: achieved.

## P1. Runtime Foundation (Completed)

Objective: executable baseline with repeatable quality checks.

Delivered:

1. Next.js + Supabase + Prisma runtime.
2. Migration baseline and route-level API structure.
3. Test scripts wired to CI.

Definition of Done: achieved.

## P2. Attendance -> Payroll Slice (Completed)

Objective: validated WI-0001 business path.

Delivered:

1. Attendance create/update/approve APIs.
2. Payroll preview/confirm APIs.
3. E2E + golden regression + prisma-backed route tests.

Definition of Done: achieved.

## P3. Leave Request/Approval Slice (Completed for MVP)

Objective: validated WI-0002 leave lifecycle and auth rules.

Delivered:

1. Leave request lifecycle APIs.
2. Balance read model behavior.
3. Audit and authorization assertions in e2e/prisma tests.

Definition of Done: achieved for MVP scope.

## P4. Next Hardening Wave (Next)

Objective: close functional/operational gaps before broader rollout.

Tasks:

1. Add external transport adapter for domain events (current implementation is in-process `noop`/`memory` only). (Completed: 2026-02-13)
2. Implement leave accrual/carry-over settlement policy (WI-0003). (Completed: 2026-02-13)
3. Define payroll Phase 2 contract set (deductions/tax) and non-breaking migration path. (Completed: 2026-02-13)
4. Add spec-to-runtime drift check for table names and migration IDs. (Completed: 2026-02-13)
5. Implement payroll Phase 2 runtime path (`preview-with-deductions`) behind feature flag. (Completed: 2026-02-13)
6. Enable staging CI with schema isolation checks and phase2 flag smoke validation. (Completed: 2026-02-13)
7. Prepare production phase2 flag baseline and runbook. (Completed: 2026-02-13)
8. Sync external production runtime flag to Vercel (`flowhr`) and deploy. (Completed: 2026-02-13)
9. Add production auth smoke workflow and run validation. (Completed: 2026-02-13)
10. Add phase2 health monitor + rollback automation workflows. (Completed: 2026-02-13)
11. Add weekly scheduled rollback dry-run rehearsal. (Completed: 2026-02-13)
12. Draft WI-0006 deduction profile contract + ADR + golden baseline. (Completed: 2026-02-13)
13. Implement WI-0006 runtime (profile CRUD + profile mode preview path). (Completed: 2026-02-13)
14. Implement WI-0007 MVP operations console on `/`. (Completed: 2026-02-13)
15. Sync production profile flag baseline to Vercel and re-verify production smoke. (Completed: 2026-02-13)
16. Add WI-0008 duplicate transition guard for approval/confirmation flows. (Completed: 2026-02-13)
17. Add WI-0009 attendance rejection flow and payroll exclusion regression coverage. (Completed: 2026-02-13)
18. Add WI-0010 profile-mode expected version guard for deduction preview. (Completed: 2026-02-13)
19. Unify Slack failure notifications and add manual alert webhook smoke workflow. (Completed: 2026-02-13)
20. Add Discord-compatible alert webhook path with Slack fallback. (Completed: 2026-02-13)
21. Add alert webhook regression tests and include them in integration gate. (Completed: 2026-02-13)
22. Add runtime-contract-ownership event traceability checks to governance gate. (Completed: 2026-02-13)
23. Add WI-0016 rejection reason traceability in reject API/audit/event and e2e tests. (Completed: 2026-02-13)
24. Add WI-0017 reject payload validation guard regression coverage. (Completed: 2026-02-13)

Definition of Done:

- Event/audit semantics are unambiguous in contracts and code.
- WI-0003 contract + tests are merged.
- Phase 2 payroll contracts are approved with compatibility strategy.
- Drift check blocks mismatched docs/spec/runtime identifiers.

## 3) Workstream Ownership

| Priority | Owner | Primary Outputs |
| --- | --- | --- |
| P0 | Orchestrator + QA | merge policy, quality gates, branch controls |
| P1 | Orchestrator + Domain Agents | runtime stack, migrations, test wiring |
| P2 | Attendance + Payroll Agents | WI-0001 APIs, rules, regression coverage |
| P3 | Leave Agent + QA | WI-0002 lifecycle and authorization validation |
| P4 | Orchestrator + Domain + QA | event semantics, WI-0003, phase-2 contracts |

## 4) Execution Style (No-Lazy Rule)

Principle:

- Execute directly when inputs and permissions are sufficient.
- Ask only for unknowns that cannot be inferred safely.
- Every unblock request is one clear line.

Request template:

- "X 값을 주시면 제가 Y를 바로 적용하겠습니다."

## 5) Inputs Needed From You (Conditional)

1. To proceed with payroll Phase 2:
   - no additional mandatory input right now

## 6) Immediate Next Actions

Without additional input, the next executable step is:

1. observe the next scheduled rollback dry-run result and keep it green,
2. monitor weekly rollback rehearsal and respond to issue/Discord alerts if any fail.
