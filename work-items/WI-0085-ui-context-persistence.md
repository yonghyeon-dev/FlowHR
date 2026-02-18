# WI-0085: UI Context Persistence (Tenant/Actor IDs)

## Background and Problem

현재 FlowHR UI는 개발/검증 목적의 Dev Header 모드를 많이 사용합니다.
이때 Tenant(Organization ID)와 Actor ID를 매번 입력해야 해서, 페이지 이동(`/` ↔ `/employee` ↔ `/ops/mvp-console`)마다 온보딩/검증 속도가 떨어집니다.

## Scope

### In Scope

- LocalStorage 기반으로 아래 컨텍스트 값을 자동 저장/복원:
  - `organizationId` (tenant)
  - employee/manager/payroll/admin/system actor id
  - 각 플로우별 employee id(출퇴근/휴가/급여/스케줄)
- `/`, `/employee`, `/ops/mvp-console` 간 컨텍스트 공유(동일 key 사용)

### Out of Scope

- Bearer access token 저장(보안상 기본은 저장하지 않음)
- 인증 UX 개선(Supabase 로그인/세션 유지)

## User Scenarios

1. 운영자가 `/`에서 조직/직원을 선택하고 새로고침해도 컨텍스트가 유지된다.
2. `/employee`로 이동해도 같은 테넌트/직원 컨텍스트로 바로 조회/신청이 가능하다.
3. `/ops/mvp-console`에서도 동일 컨텍스트로 빠르게 검증이 가능하다.

## Data Changes (Tables and Migrations)

- 없음

## API/Event Changes

- 없음

## Test Plan

- `npm run lint`
- `npm run typecheck`
- 로컬 수동 검증:
  - `/`에서 Organization ID/Actor ID 변경 → 새로고침 후 유지 확인
  - `/employee` 이동 → 동일 컨텍스트로 조회 성공 확인

## Rollback Plan

- `src/lib/client/useStickyState.ts` 제거 + 각 페이지의 state 복원

