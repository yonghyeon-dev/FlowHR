# WI-0084: People Onboarding UI (Organization/Employee)

## Background and Problem

현재 FlowHR는 대부분의 핵심 플로우(출퇴근/휴가/급여)가 `Employee` 마스터 존재를 전제로 합니다.
하지만 UI에서 조직/직원을 생성할 수 없으면 초기 온보딩이 DB 수동 작업에 의존하게 되고, 로컬/스테이징에서 기능 확인이 막힙니다.

## Scope

### In Scope

- `/admin` 관리자 대시보드에 People(조직/직원) 온보딩 패널 추가
  - 조직 생성/목록 조회 (`/api/people/organizations`)
  - 직원 생성/목록 조회 (`/api/people/employees`)
  - 조직 선택 시 Tenant(Organization ID) 컨텍스트에 즉시 반영
  - 직원 선택 시 출퇴근/휴가/급여 폼의 기본 Employee ID에 즉시 반영
- Dev Header 모드에서 조직 생성/목록 조회 시에는 `x-actor-organization-id` 헤더를 생략하여(tenantScope=null) 생성이 가능하도록 UX 제공

### Out of Scope

- 부서/직무/직급/조직도, 입사/퇴사 워크플로
- 초대/가입, 프로덕션 인증 UX
- People API/DB 스키마 변경

## User Scenarios

1. 운영자가 조직을 생성한다. (Dev Header 모드에서는 tenantScope 없이 생성)
2. 생성된 조직을 Tenant 컨텍스트로 선택한다.
3. 해당 조직에 직원을 생성한다.
4. 같은 화면에서 승인 대기함/집계/급여까지 수직 슬라이스를 즉시 검증한다.

## Data Changes (Tables and Migrations)

- 없음

## API/Event Changes

- 없음 (기존 People API 사용)

## Test Plan

- `npm run lint`
- `npm run typecheck`
- `npm test`
- 로컬 수동 검증:
  - 조직 생성 → 조직 목록 조회
  - 직원 생성 → 직원 목록 조회
  - 생성한 직원으로 출퇴근 기록 생성이 성공하는지 확인

## Observability

- 변경 없음 (기존 API 로그/감사로그 활용)

## Rollback Plan

- `src/app/admin/page.tsx`에서 WI-0084 변경 revert

