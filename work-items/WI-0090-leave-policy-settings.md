# WI-0090: 휴가 정책 엔진 베이스라인 (조직 단위 정책)

## 배경/문제

현재 연차 부여/이월 정산은 코드/SSoT 기본값(부여 15일, 이월 상한 5일)에 의존한다.
관리자 UI에서 값을 넘겨서 정산할 수는 있지만, **조직 정책으로 저장/재사용**할 수 없어 SaaS 제품으로 부족하다.

## 목표

- 조직(Organization) 단위로 휴가 정책을 저장하고, 정산 시 기본값으로 사용한다.
- 정책은 “결재/급여” 흐름에 영향을 주므로 감사로그/권한을 포함해 최소 안전장치를 갖춘다.

## 범위 (In)

- DB
  - 신규 테이블 `LeavePolicy` (organizationId unique)
  - 마이그레이션 `202602180002_leave_policy`
- API
  - `GET /api/leave/policy?organizationId=...` (정책 조회, 없으면 default 반환)
  - `PUT /api/leave/policy` (정책 upsert)
- 도메인 로직
  - `/leave/accrual/settle`에서 `annualGrantDays/carryOverCapDays` 미전달 시 정책 기본값 적용
- 관측성
  - audit: `leave.policy_read`, `leave.policy_updated`
  - event: `leave.policy.updated.v1`
- 테스트
  - `e2e-wi0002-leave.test.ts`에 정책 upsert/read + 정책 기반 정산 케이스 추가
- 스펙
  - `specs/leave/*` contract/api/test-cases/db 업데이트 (SemVer bump)
  - `specs/common/time-and-payroll-rules.md`에 정책 override 규칙 반영

## 범위 (Out)

- 연차촉진, 입사/퇴사/근속에 따른 prorate 계산
- 반차/시간단위 휴가
- 정책 버전 관리/유효기간(Effective date) 고도화

## Data Changes (Tables and Migrations)

- Table: `LeavePolicy`
- Migration IDs:
  - `202602180002_leave_policy`

## DoD

- 정책이 없는 조직은 기존 default로 동일 동작한다(호환성 유지).
- 정책이 설정된 조직은 정산 시 정책이 기본값으로 적용된다.
- 권한 없는 actor는 정책 upsert를 할 수 없다.
- CI에서 contract/traceability/e2e(MVP suite) 통과.
