# WI-1096: 로그인 세션 표면 제품화

## Background

- 로그인 페이지가 raw `userId`, `organizationId`, `actorId`를 그대로 노출하고 있다.
- 로그인 안내 문구와 오류 표면에도 Supabase/Dev Header 같은 개발자 중심 설명이 남아 있다.

## Scope

- 로그인 페이지 세션 요약 패널을 제품 언어로 교체한다.
- 로그인 안내/오류 문구를 사용자 중심 문구로 정리한다.
- 회귀 가드를 추가해 raw 세션 식별자 노출이 다시 들어오지 않게 막는다.

## Acceptance Criteria

- 로그인 페이지에서 raw `userId`, `organizationId`, `actorId`가 보이지 않는다.
- 로그인 세션 패널은 로그인 계정, 역할, 작업 공간 상태, 세션 상태만 노출한다.
- 로그인 페이지 문구는 Supabase/Dev Header 같은 개발자 설명을 직접 노출하지 않는다.
- 공통 오류 헬퍼가 로그인 인증 오류를 사용자 메시지로 치환한다.

## Files

- `src/app/login/page.tsx`
- `src/lib/i18n/messages.ts`
- `src/lib/product-language.ts`
- `scripts/tests/e2e-wi1096-login-session-surface-productization.test.ts`

## Verification

- `npm run typecheck`
- `npm test`
- `npm run test:integration`
