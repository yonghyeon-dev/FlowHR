# WI-0975: Contracts API bearer token 누락 수정

## Background and Problem

일부 contracts UI 컴포넌트가 raw `fetch()`를 직접 호출하면서 `Authorization: Bearer <token>` 헤더를 전달하지 않았습니다.
이 경로에서는 서버가 인증 주체를 해석하지 못해 401/권한 오류가 발생할 수 있습니다.

## Scope

### In Scope

- `src/components/contracts/useAdminContractsWorkspaceActions.ts`의 raw `fetch()` 호출에 bearer 토큰 헤더 추가.
- `src/components/contracts/ContractTemplateBuilder.tsx`의 템플릿 생성 API 호출에 bearer 토큰 헤더 추가.
- `src/components/contracts/EmployeeContractsInbox.tsx`의 문서 조회/응답/증빙 조회 API 호출에 bearer 토큰 헤더 추가.
- 토큰은 `useSupabaseSession()`의 `snapshot.accessToken`에서 읽어 사용.

### Out of Scope

- API 계약/스키마/마이그레이션 변경.
- contracts 라우트 구조 변경.

## Test Plan

- `node --experimental-strip-types scripts/tests/e2e-wi0975-contracts-bearer-token.test.ts`
- `npm run typecheck`

## ADR

- Not required: 기존 인증 헤더 누락 버그를 보완하는 구현 수정으로 아키텍처 변경이 없습니다.
