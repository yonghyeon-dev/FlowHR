# WI-0088: SaaS Core UI (Admin Dashboard + Employee Payslips)

## Background and Problem

현재 UI가 운영/검증 콘솔 중심으로 보이며, SaaS 핵심(관리자 대시보드/직원 셀프서비스/명세서)이 제품 UX로 드러나지 않습니다.
FlowHR는 Shiftee/Flex 상위호환을 목표로 하므로 "넓은 기능 + 적정 깊이 + UI"를 먼저 완성해야 합니다.

## Scope

### In Scope

- SaaS 진입점 `/` 추가: 관리자/직원 흐름으로 바로 이동할 수 있는 홈 화면
- 관리자 대시보드 `/admin`:
  - 직원 관리(직원 생성/목록)
  - 승인 대기함(출퇴근/휴가/급여 프리뷰) 인라인 승인/반려/확정
  - 근태 집계 조회
  - 휴가 정책/정산 MVP(연차 부여/이월 정산)
  - 급여 프리뷰 생성 및 확정
- 직원 명세서 `/employee/payslips`:
  - 직원이 본인 `CONFIRMED` 급여만 조회
  - 근태 집계(정규/연장/야간/휴일) 요약 표시
- 운영/검증 콘솔은 `/ops/*`로 분리(기본 UI에서는 노출하지 않음)

### Out of Scope

- 한국 세법/4대보험 완전 구현(Phase 4)
- 다단계 결재선/문서 양식/전자서명(Phase 5)
- 모바일 앱(Phase 7)

## User Scenarios

1. 관리자: `/admin`에서 직원 생성 → 승인 대기함 확인 → 급여 프리뷰/확정
2. 직원: `/employee`에서 출퇴근/휴가 처리 → `/employee/payslips`에서 확정 급여 조회

## Payroll Accuracy and Calculation Rules

- Source of truth rule: 확정 급여는 `PayrollRun(state=CONFIRMED)` 기준
- Rounding rule: KRW integer (기존 계약/테스트 기준 유지)
- Exception handling rule: employee는 본인 `CONFIRMED`만 조회 가능 (PREVIEWED/타인 차단)

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| List payroll runs (any) | Allow | Deny | Deny | Allow |
| List payroll runs (own confirmed) | Allow | Deny | Allow | Allow |
| Confirm payroll run | Allow | Deny | Deny | Allow |
| Approve/reject attendance/leave | Allow | Allow | Deny | Allow |

## Data Changes (Tables and Migrations)

- Tables: `RolePermission`
- Migration IDs: `202602180001_rbac_payroll_run_list_own`
- Backward compatibility plan: 기존 payroll_operator/admin 리스트 권한 유지, employee는 서비스 레이어에서 confirmed-only로 제한

## API and Event Changes

- Endpoints:
  - `GET /api/payroll/runs` employee self-service 범위 확장(own + confirmed-only)
- Events published: 없음(기존 payroll/attendance/leave 이벤트 유지)
- Events consumed: 없음

## Test Plan

- Unit: RBAC permission 상수/매핑 변경
- Integration: employee가 payroll runs를 조회할 때 confirmed-only + self-only 강제
- Regression: `scripts/tests/e2e-wi0001.test.ts` 갱신 및 전체 e2e/Golden 통과
- Authorization: employee가 타인/previewed 조회 시 403
- Payroll accuracy: 기존 gross/deductions 계산 회귀 없음

## Observability and Audit Logging

- Audit events: 기존 payroll audit 로그 유지
- Metrics: N/A
- Alert conditions: N/A

## Rollback Plan

- Feature flag behavior: UI 분리/노출은 `NEXT_PUBLIC_FLOWHR_DEV_TOOLS`로 제어
- DB rollback method: 해당 migration revert(필요 시 RolePermission row 제거)
- Recovery target time: 15m

## Definition of Ready (DoR)

- [x] 요구사항: "콘솔이 아니라 SaaS UI"로 방향 전환 합의
- [x] Contract 업데이트 대상 식별(payroll list 권한/문구)
- [x] 권한 매트릭스 작성
- [x] 데이터 변경 영향도 평가(RBAC seed)
- [x] 롤백/리스크 작성

## Definition of Done (DoD)

- [ ] `/` 홈 + `/admin` + `/employee/payslips` 동작
- [ ] employee는 본인 confirmed payroll만 조회 가능
- [ ] 테스트/CI 게이트 통과
- [ ] 계약/테스트케이스 문서 반영
