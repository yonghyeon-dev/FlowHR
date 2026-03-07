# WI-1026: 클라이언트 로그인 시 Organization 레코드 자동 생성

## Background and Problem

클라이언트 로그인(`signInWithPassword`)은 `/auth/callback` 라우트를 거치지 않습니다.
콜백 라우트에만 `ensureOrganizationRecord()`가 있어서, 비밀번호 로그인 시
Organization 테이블에 해당 org 레코드가 없으면 모든 org 의존 API가 404를 반환합니다.

영향:
- `/api/approval/executions?organizationId=...` → 404 (admin 대시보드, analytics, KPI 페이지)
- `/api/admin/settings` → 404 (admin 설정 페이지)
- org lookup이 필요한 모든 API에 동일 영향

## Scope

### In Scope
- 클라이언트 로그인 후 org 레코드 자동 생성
- `ensureOrganizationRecord()` 재사용 (callback-organization-recovery.ts에 이미 존재)
- admin 레이아웃 또는 공통 훅에서 org 존재 여부 확인 + 생성 API 호출

### Out of Scope
- Supabase 유저 메타데이터 변경
- 인증 흐름 변경

## Implementation Approach

추천 방식: admin 레이아웃에서 로그인 후 세션의 organizationId를 읽어
`/api/auth/ensure-organization` (신규 API) 또는 기존 setup-metadata 라우트를
확장하여 org 레코드 존재를 보장.

### 방식 A: 새 API 라우트 추가
1. `src/app/api/auth/ensure-organization/route.ts` 생성
2. Bearer 토큰에서 actor 읽기 → organizationId 추출
3. `ensureOrganizationRecord()` 호출
4. admin 레이아웃 또는 `useSupabaseSession` 훅에서 세션 확보 시 1회 호출

### 방식 B: approval/executions 등 org lookup 실패 시 자동 생성
1. `resolveOrganizationId()` 함수에서 org 없으면 `ensureOrganizationRecord()` 호출
2. 기존 코드 최소 변경

방식 A 권장 (명시적, 부작용 적음).

## Test Plan

1. admin 계정으로 로그인 (signInWithPassword)
2. `/admin` 대시보드 접속
3. `/api/approval/executions` 호출 시 200 반환 확인
4. `/api/admin/settings` 호출 시 200 반환 확인
5. Organization 테이블에 해당 org 레코드 존재 확인

## ADR

- 기존 `ensureOrganizationRecord()` 유틸을 재사용하여 중복 방지
- 클라이언트 → 서버 1회 호출로 org 보장 (매 API 호출마다 확인하지 않음)

## Implementation Notes

- `src/app/api/auth/ensure-organization/route.ts`에서 Bearer 토큰의 app metadata를 읽어 organization 레코드를 보장
- `src/lib/client/useSupabaseSession.ts`에서 세션 hydrate 시 organization ensure가 끝날 때까지 `loading` 유지
- `scripts/tests/e2e-wi1026-org-record-auto-ensure.test.ts`로 신규 라우트/세션 훅 연결 회귀 가드 추가
