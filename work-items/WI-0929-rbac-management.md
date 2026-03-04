# WI-0929 RBAC 역할 관리 API (CRUD + 할당)

## Scope
- 관리자 전용 역할 관리 API 추가:
  - `GET /api/admin/roles`
  - `POST /api/admin/roles`
  - `PATCH /api/admin/roles/[roleId]`
  - `POST /api/admin/roles/assign`
  - `GET /api/admin/roles/assignments`
- 모든 엔드포인트는 `admin` 역할만 허용
- 역할 할당 시 Supabase Admin API로 `app_metadata.role` 갱신

## Implementation
- 관리자 역할 관리 서비스 추가:
  - `src/features/rbac/admin-service.ts`
  - 기능:
    - 역할 생성(이름 기반 roleId 정규화)
    - 역할 수정(부분 업데이트)
    - 직원 역할 할당(Supabase `listUsers` + `updateUserById`)
    - 역할 할당 현황 조회(직원 목록 + Supabase metadata 매핑)
- 요청 스키마 확장:
  - `src/features/rbac/schemas.ts`
  - `createRoleSchema`, `updateRoleSchema`, `assignRoleSchema` 추가
- 관리자 RBAC API 라우트 추가:
  - `src/app/api/admin/roles/route.ts`
  - `src/app/api/admin/roles/[roleId]/route.ts`
  - `src/app/api/admin/roles/assign/route.ts`
  - `src/app/api/admin/roles/assignments/route.ts`
  - `src/app/api/admin/roles/shared.ts` 공통 admin 인증/조직 검증 헬퍼

## Test
- 추가:
  - `scripts/tests/e2e-wi0929-rbac-management.test.ts`
- 검증 시나리오:
  - 역할 생성 후 목록 조회 반영 확인
  - 역할 수정 후 반영 확인
  - 역할 할당 후 할당 현황 반영 확인
  - `employee` 역할의 모든 admin roles API 접근 `403` 확인

## Verification
- `npm.cmd exec tsx scripts/tests/e2e-wi0929-rbac-management.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
