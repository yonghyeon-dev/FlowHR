# WI-0115: Approval Gate Preview API and Admin UX

## Background and Problem

Approval policy and template settings can block critical attendance/leave/payroll actions. Operators currently discover misconfiguration only when runtime gate denies an action.

## Scope

### In Scope

- Add read-only gate preview API for policy/template/delegation simulation.
- Provide preview inputs and results in `/admin/approval-templates`.
- Reuse runtime gate resolution logic to avoid divergence.
- Add e2e regression for matched/non-matched/delegated preview outcomes.

### Out of Scope

- Multi-step approval flow execution.
- Preview history persistence or report export.
- External groupware simulation.

## User Scenarios

1. Admin previews PAYROLL gate at `grossPayKrw=120000` and verifies template match requires `admin`.
2. Admin previews PAYROLL gate at `grossPayKrw=80000` and verifies fallback role `payroll_operator`.
3. Admin previews delegated actor and confirms delegated allowance before production use.

## Payroll Accuracy and Calculation Rules

- Payroll amount is used only as routing context for template match; no payroll formula change.

## Authorization and Role Matrix

| Action | Admin | Manager | Payroll Operator | Employee | System |
| --- | --- | --- | --- | --- | --- |
| Gate preview execute | Allow | Allow (read scope) | Allow (read scope) | Deny | Allow |
| Gate preview mutation | Deny (read-only endpoint) | Deny | Deny | Deny | Deny |

## Data Changes

- Tables referenced: `ApprovalPolicy`, `ApprovalDelegation`, `ApprovalLineTemplate`
- Migration IDs: 없음 (API/서비스/UI 변경만 포함)

## API and Event Changes

- Endpoints:
  - `POST /approval/policy/gate-preview`
- Events published: 없음
- Events consumed: 없음

## Test Plan

- Unit:
  - preview schema validation (`domain` vs `payrollGrossPayKrw`)
  - preview allow reason selection (`expected_role` / `active_delegation` / `denied`)
- Integration:
  - PAYROLL threshold match preview returns template-based expected roles
  - PAYROLL threshold mismatch preview returns policy fallback expected role
  - delegated actor preview returns `active_delegation`
- Regression:
  - preview decision remains aligned with runtime gate behavior
- Authorization:
  - preview endpoint requires approval policy read permission

## Observability and Audit Logging

- Audit events:
  - `approval.policy_gate.previewed`
- Metrics:
  - `approval_policy_gate_denied_count` (runtime 대비 참고)
- Alert conditions:
  - preview-denied 급증 시 정책 변경 오작동 점검.

## Rollback Plan

- Hide preview UI panel and disable endpoint route if unexpected behavior 발생.
- Runtime gate logic는 유지되므로 승인 플로우 영향 없이 복구 가능.
- Recovery target: 15m.

## Definition of Ready (DoR)

- [x] Preview 입력/출력 스키마 정의 완료.
- [x] Runtime gate와 동일 로직 재사용 방안 확정.
- [x] 관리자 UI 반영 범위 확정.

## Definition of Done (DoD)

- [x] `/approval/policy/gate-preview` API 구현.
- [x] Admin 결재선 템플릿 화면에 프리뷰 패널 추가.
- [x] WI-0115 e2e 회귀 테스트 추가 및 suite 연결.
- [x] Approval contract/api/test-cases/rfc 반영.
