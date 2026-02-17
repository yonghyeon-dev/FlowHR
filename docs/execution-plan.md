# FlowHR Execution Plan (Priority-Driven)

Date: 2026-02-16  
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
- WI-0018 contract/API version alignment gate is implemented:
  - `check_contracts.py` requires sibling `api.yaml` for each domain contract
  - `api.yaml` `info.version` must follow SemVer
  - contract/API version mismatch now fails governance gate
- WI-0019 API/contract coupling gate is implemented:
  - changed `api.yaml` now requires sibling `contract.yaml` change in diff checks
  - API-only spec changes are blocked until contract/version update is included
  - versioning policy now documents API/contract coupling enforcement
- WI-0020 contract governance regression harness is implemented:
  - `test_check_contracts_regression.py` fixes expected behaviors for governance rules
  - CI `contract-governance` job runs regression tests after contract lint/version checks
  - script refactors now fail fast if SemVer/coupling rules regress
- WI-0021 PR template compliance gate is implemented:
  - `check_pr_template.py` validates required checklist/work-item/ADR metadata
  - break-glass trigger usage requires incident/approval/rollback fields
  - `contract-governance` now enforces PR metadata completeness on pull requests
- WI-0022 alert context links are implemented:
  - notifier payload includes optional runbook/break-glass/rollback workflow links
  - production failure workflows pass context link env vars to webhook notifier
  - webhook regression tests verify enriched Slack/Discord payload content
- WI-0023 PR template regression harness is implemented:
  - `test_check_pr_template_regression.py` fixes expected PR metadata gate behavior
  - `contract-governance` now executes PR template regression tests in CI
  - PR template rule regressions fail pre-merge
- WI-0024 golden change-control gate is implemented:
  - golden fixture diffs now require linked work item and contract updates
  - breaking fixture changes (delete/rename/id-change) require ADR update
  - golden governance regression tests are executed in CI
- Golden fixtures (`GC-001` to `GC-006`) are validated in CI and executable tests.
- Supabase role claim governance script exists (`dry-run`, `apply`, `enforce`).
- Staging Prisma integration is enabled with schema isolation guardrails.
- Payroll phase2 health workflow incident noise is reduced (gate skip when Phase2 is disabled, 409 expected/mismatch/ignored classification, incident dedup).
- WI-0034 employee/org master data is implemented (Organization/Employee tables + People API).

Open gaps:

- Phase 2 core functionality is still missing (tracked in `ROADMAP.md`):
  - operator-facing streaming dashboard UI and operations automation on top of cockpit+ticket+stream baseline
- Web UI and employee self-service are not started (Phase 6).
- Approvals and e-contract are not started (Phase 5).

Recently delivered:

- Employee/Organization master data baseline exists and is audited (WI-0034).
- employeeId FK integrity and RBAC foundation are merged (WI-0035, WI-0036).
- Multi-tenant isolation baseline (Supabase RLS) is merged (WI-0037).
- Scheduling CRUD baseline (create/list/update/delete), template single/range assignment baseline, rotation assignment baseline, and anomaly read model are merged (WI-0040, WI-0041, WI-0042, WI-0043, WI-0044, WI-0045, WI-0046, WI-0047).
- Attendance capture channel metadata baseline is merged (GPS/QR/Wi-Fi/device/location metadata on create/update; WI-0048).
- Attendance employee GPS policy enforcement baseline is merged behind feature flag (`FLOWHR_ATTENDANCE_GPS_REQUIRED`; WI-0049).
- Attendance employee geofence policy enforcement baseline is merged behind feature flag (`FLOWHR_ATTENDANCE_GEOFENCE_ENABLED`; WI-0050).
- Scheduling anomaly alert automation baseline is merged behind feature flag (`FLOWHR_SCHEDULING_ANOMALY_ALERTS_ENABLED`; WI-0051).
- Attendance trusted device allowlist policy baseline is merged behind feature flag (`FLOWHR_ATTENDANCE_TRUSTED_DEVICE_ENABLED`; WI-0052).
- Attendance multi-site geofence policy baseline is merged behind feature flag (`FLOWHR_ATTENDANCE_MULTI_SITE_GEOFENCE_ENABLED`; WI-0053).
- Attendance device attestation policy baseline is merged behind feature flag (`FLOWHR_ATTENDANCE_DEVICE_ATTESTATION_ENABLED`; WI-0054).
- Scheduling anomaly escalation policy baseline is merged behind feature flag (`FLOWHR_SCHEDULING_ANOMALY_ESCALATION_ENABLED`; WI-0055).
- Attendance anti-spoofing risk scoring baseline is merged behind feature flag (`FLOWHR_ATTENDANCE_ANTI_SPOOFING_ENABLED`; WI-0056).
- Scheduling rotation balance report baseline is merged via read-only endpoint (`GET /scheduling/rotations/balance`; WI-0057).
- Scheduling rotation optimization baseline is merged via evaluate/apply endpoint (`POST /scheduling/rotations/optimize`; WI-0058).
- Scheduling rotation fairness report baseline is merged via tenant-level read-only endpoint (`POST /scheduling/rotations/fairness`; WI-0059).
- Attendance anti-spoofing signal-fusion/reputation baseline is merged behind feature flag (`FLOWHR_ATTENDANCE_ANTI_SPOOFING_SIGNAL_FUSION_ENABLED`; WI-0060).
- Scheduling fairness write-back orchestration baseline is merged via tenant-level apply endpoint (`POST /scheduling/rotations/fairness/apply`; WI-0061).
- Attendance dynamic external reputation integration baseline is merged behind feature flag (`FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_ENABLED`; WI-0062).
- Scheduling global fairness constraints baseline is merged via fairness report/apply payload extension (`globalConstraints`; WI-0063).
- Attendance multi-provider reputation orchestration baseline is merged (`URLS` + aggregation + minimum-success; WI-0064).
- Scheduling anomaly cockpit dashboard baseline is merged (`GET /scheduling/anomalies/cockpit`; WI-0065).
- Attendance reputation circuit-breaker operations baseline is merged (failure-threshold/cooldown provider skip; WI-0066).
- Scheduling anomaly cockpit ticket automation baseline is merged (severity-threshold ticket request event/audit; WI-0067).
- Scheduling anomaly cockpit streaming dashboard baseline is merged (`GET /scheduling/anomalies/cockpit/stream`; WI-0068).
- Scheduling advanced fairness multi-objective optimizer is merged (`advancedConstraints` on fairness report/apply with preference/labor-law weighted scoring; WI-0069).
- Attendance reputation adaptive routing/auto-heal baseline is merged (provider prioritization + open-circuit probe recovery; WI-0070).

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

## P4. Hardening Wave (Completed)

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
25. Add WI-0018 contract/API version alignment check to contract governance gate. (Completed: 2026-02-13)
26. Add WI-0019 API/contract coupling check for API-only spec changes. (Completed: 2026-02-13)
27. Add WI-0020 regression tests for contract governance script rules. (Completed: 2026-02-13)
28. Add WI-0021 PR template compliance checks in governance gate. (Completed: 2026-02-14)
29. Add WI-0022 alert context link enrichment for failure notifications. (Completed: 2026-02-14)
30. Add WI-0023 regression tests for PR template compliance gate. (Completed: 2026-02-14)
31. Add WI-0024 golden fixture change-control gate and regression tests. (Completed: 2026-02-14)

Definition of Done:

- Event/audit semantics are unambiguous in contracts and code.
- WI-0003 contract + tests are merged.
- Phase 2 payroll contracts are approved with compatibility strategy.
- Drift check blocks mismatched docs/spec/runtime identifiers.

## P5. Production Foundation (Done)

Objective: establish production-grade HR SaaS foundations before expanding modules.

Tasks (Phase 1 stubs):

1. (Done) `work-items/WI-0034-employee-organization-master-model.md`
2. (Done) `work-items/WI-0035-employeeid-fk-migration.md`
3. (Done) `work-items/WI-0036-rbac-engine-foundation.md`
4. (Done) `work-items/WI-0037-multi-tenant-rls-baseline.md`

Definition of Done:

- Employee/Organization master data exists and is audited.
- Core domain tables enforce employee integrity (FK).
- Authorization is RBAC-based (no hardcoded role lists for core APIs).
- Tenant isolation is enforced at DB level (RLS) for core tables.

## P6. Phase 2 Kickoff (Scheduling)

Objective: establish minimal schedule planning to unlock Phase 2 (shifts/rotations, anomaly detection).

Tasks:

1. (Done) `work-items/WI-0040-scheduling-baseline.md`
2. (Done) `work-items/WI-0041-scheduling-overlap-guard.md`
3. (Done) `work-items/WI-0042-scheduling-update-api.md`
4. (Done) `work-items/WI-0043-scheduling-delete-api.md`
5. (Done) `work-items/WI-0044-scheduling-template-recurring-baseline.md`
6. (Done) `work-items/WI-0045-scheduling-anomaly-report.md`
7. (Done) `work-items/WI-0046-scheduling-template-range-assignment.md`
8. (Done) `work-items/WI-0047-scheduling-rotation-assignment.md`
9. (Done) `work-items/WI-0048-attendance-capture-channel-metadata.md`
10. (Done) `work-items/WI-0049-attendance-gps-policy-enforcement.md`
11. (Done) `work-items/WI-0050-attendance-geofence-policy.md`
12. (Done) `work-items/WI-0051-scheduling-anomaly-alert-automation.md`
13. (Done) `work-items/WI-0052-attendance-trusted-device-policy.md`
14. (Done) `work-items/WI-0053-attendance-multisite-geofence-policy.md`
15. (Done) `work-items/WI-0054-attendance-device-attestation-policy.md`
16. (Done) `work-items/WI-0055-scheduling-anomaly-escalation-policy.md`
17. (Done) `work-items/WI-0056-attendance-anti-spoofing-policy.md`
18. (Done) `work-items/WI-0057-scheduling-rotation-balance-report.md`
19. (Done) `work-items/WI-0058-scheduling-rotation-optimization.md`
20. (Done) `work-items/WI-0059-scheduling-rotation-fairness.md`
21. (Done) `work-items/WI-0060-attendance-anti-spoofing-signal-fusion.md`
22. (Done) `work-items/WI-0061-scheduling-fairness-writeback.md`
23. (Done) `work-items/WI-0062-attendance-external-reputation-integration.md`
24. (Done) `work-items/WI-0063-scheduling-global-fairness-constraints.md`
25. (Done) `work-items/WI-0064-attendance-multi-provider-reputation-orchestration.md`
26. (Done) `work-items/WI-0065-scheduling-anomaly-cockpit-dashboard.md`
27. (Done) `work-items/WI-0066-attendance-reputation-circuit-breaker-operations.md`
28. (Done) `work-items/WI-0067-scheduling-anomaly-cockpit-ticket-automation.md`
29. (Done) `work-items/WI-0068-scheduling-anomaly-cockpit-streaming-dashboard.md`
30. (Done) `work-items/WI-0069-scheduling-advanced-fairness-multi-objective.md`
31. (Done) `work-items/WI-0070-attendance-reputation-adaptive-routing-autoheal.md`

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

1. define WI for operator streaming dashboard UI and incident automation on top of cockpit stream baseline.
