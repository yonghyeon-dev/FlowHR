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
- Golden fixtures (`GC-001` to `GC-005`) are validated in CI and executable tests.
- Supabase role claim governance script exists (`dry-run`, `apply`, `enforce`).
- Staging Prisma integration is opt-in (default OFF) with schema isolation guardrails.

Open gaps:

- Payroll Phase 2 (deductions/tax/remittance) remains out of scope.
- Domain event publication adapter exists (`noop`/`memory`), but external transport integration is not implemented yet.
- Staging integration is disabled by default; continuous validation is not active until explicitly enabled.

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

1. Add external transport adapter for domain events (current implementation is in-process `noop`/`memory` only).
2. Implement leave accrual/carry-over settlement policy (WI-0003). (Completed: 2026-02-13)
3. Define payroll Phase 2 contract set (deductions/tax) and non-breaking migration path.
4. Add spec-to-runtime drift check for table names and migration IDs. (Completed: 2026-02-13)
5. Enable staging CI only when needed (`FLOWHR_ENABLE_STAGING_CI=true`) and keep schema isolation checks green.

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

1. To enable staging CI:
   - Repository variable: `FLOWHR_ENABLE_STAGING_CI=true`
   - Five `FLOWHR_STAGING_*` secrets

2. To proceed with payroll Phase 2:
   - Policy decisions for deductions/tax scope and rollout boundary

## 6) Immediate Next Actions

Without additional input, the next executable step is:

1. define external domain-event transport rollout plan and fallback policy,
2. create payroll Phase 2 (deductions/tax) contract artifacts and compatibility matrix,
3. enable staging CI with guarded secrets when staging DB is ready.
