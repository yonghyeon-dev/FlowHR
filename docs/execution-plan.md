# FlowHR Execution Plan (Priority-Driven)

Date: 2026-02-13  
Goal: Deliver a stable contract-first HRM vertical slice with enforceable QA gates.

## 1) Current Baseline

Completed:

- Governance scaffold (`docs`, `specs`, `contracts`, `qa`, `.github`).
- Contract templates and CI checks (`check_contracts.py`, `check_golden_fixtures.py`).
- Initial vertical slice artifacts (`WI-0001`, attendance/payroll contracts and test cases).
- Branch protection on `main` applied via GitHub API.
- Agent model document created (`docs/agents.md`).
- WI-0001 service-layer refactor and route-level e2e gate merged.
- Canonical Supabase role claim policy documented (`app_metadata.role`).

Open gaps:

- Leave request/approval runtime implementation is not yet delivered.
- Role claim backfill/enforcement is not yet run in target Supabase project.
- Staging Prisma integration job requires repository secrets to be configured.

## 2) Priority Roadmap

## P0. Governance Hardening (Immediate)

Objective: Make policy violations unmergeable.

Tasks:

1. Keep single-owner `CODEOWNERS` mapping and document persona-based review rule.
2. Validate branch protection settings against policy document.
3. Add README section for contribution flow and PR gate expectations.

Definition of Done:

- PR flow works in 1-person mode without policy bypass.
- Required checks are blocking merges.
- Team can follow one documented merge flow.

## P1. Runtime Foundation (Next)

Objective: Create executable app baseline for WI-0001.

Tasks:

1. Initialize backend stack (NestJS or Express + TypeScript).
2. Configure PostgreSQL + Prisma schema/migration baseline.
3. Add test stack (`jest`, `supertest`, `playwright` skeleton).
4. Wire CI scripts to actual npm scripts.

Definition of Done:

- `npm run lint`, `npm run typecheck`, `npm test` all run.
- Prisma validate + migration smoke works in CI.
- API server boots locally.

## P2. Attendance Domain Implementation

Objective: Implement attendance contract v1 with auditability.

Tasks:

1. Implement attendance record create/update/approve APIs.
2. Persist attendance entities and approval transitions.
3. Emit `attendance.recorded.v1`, `attendance.corrected.v1`, `attendance.approved.v1`.
4. Add authorization and audit log coverage.

Definition of Done:

- Contract tests pass for attendance flows.
- Unauthorized actions are blocked and logged.
- Spec Gate and Code Gate both pass.

## P3. Payroll Domain Implementation

Objective: Implement payroll preview from attendance aggregates.

Tasks:

1. Implement payroll preview and confirm APIs.
2. Consume approved attendance projection/event data.
3. Apply SSoT rules (timezone/boundary/rounding/multipliers).
4. Persist payroll runs/items and emit audit events.

Definition of Done:

- Deterministic gross-pay results from same input.
- Recalculation path works for corrections.
- QA checks pass for accuracy and authorization.

## P4. End-to-End Vertical Slice Validation

Objective: Validate `attendance -> aggregation -> payroll` as one releasable path.

Tasks:

1. Implement golden regression execution against fixtures.
2. Add integration test for WI-0001 full path.
3. Add release checklist with rollback steps.
4. Create release candidate PR and run full gates.

Definition of Done:

- Golden regression passes in CI.
- WI-0001 integration test passes.
- Merge approved without policy bypass.

## P5. Leave and Identity Hardening (Current)

Objective: Prepare next domain slice and tighten auth/runtime operations.

Tasks:

1. Add WI-0002 leave request/approval contract-first artifacts.
2. Add role-claim backfill/enforcement script for Supabase users.
3. Add staging Prisma-backed route integration job in CI.

Definition of Done:

- WI-0002 work item + leave contract/API/DB/test-case docs exist.
- `app_metadata.role` governance can be dry-run/applied/enforced by script.
- Main-branch push can run Prisma integration test when staging secrets exist.

## 3) Workstream Ownership

| Priority | Owner | Primary Outputs |
| --- | --- | --- |
| P0 | Orchestrator + QA | CODEOWNERS, branch policy validation |
| P1 | Orchestrator + Domain Agents | app scaffold, Prisma, test wiring |
| P2 | Attendance Agent | attendance APIs/events/tests |
| P3 | Payroll Agent | payroll APIs/calculators/tests |
| P4 | QA Agent + Orchestrator | E2E regression proof and release gate |

## 4) Execution Style (No-Lazy Rule)

Principle:

- Agent executes directly whenever permissions and inputs are sufficient.
- Agent asks only for missing facts that cannot be inferred safely.
- Every ask is a one-line unblocker.

Request template:

- "X 값을 주시면 제가 Y를 바로 적용하겠습니다."

## 5) Minimal Inputs Needed From You

1. Supabase keys  
Format: `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

2. Database password fill-in  
Format: replace `YOUR-PASSWORD` in `.env.local` for `DATABASE_URL` and `DIRECT_URL`

## 6) Immediate Next Actions After Inputs

Once you provide the 2 inputs above, I will directly:

1. keep governance in single-operator persona mode,
2. run first Prisma migration and generate client,
3. implement WI-0001 API skeleton with tests wired to CI.
