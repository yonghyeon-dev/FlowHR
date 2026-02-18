# WI-0093: Supabase Auth Session Integration (Production Fallback)

## Background and Problem

현재 `/admin`, `/employee` UI는 Dev Header(x-actor-*) 모드에 최적화되어 있습니다.
하지만 Vercel Preview/Production 환경에서는 `NODE_ENV=production`이므로 Dev Header 인증이 동작하지 않아,
실제 SaaS 데모/검증이 불가능해집니다.

## Scope

### In Scope

- Client UI에서 `NODE_ENV=production`일 때 Supabase Auth 세션을 읽고(access token),
  API 호출 시 Bearer 토큰을 자동 사용
- 세션이 없으면 UI 상단에 “로그인 필요” 배너 노출
- 세션의 `app_metadata` 정보를 UI에 안전하게 표시(이메일/role/org/actor_id)
- `app_metadata.actor_id`가 있으면 actor id로 우선 사용하도록 서버 actor 파서 지원(이미 추가됨)

### Out of Scope

- RBAC 기반 페이지 접근 제어(middleware) 완성
- 사용자/직원 매핑 자동 생성(입사/초대/프로비저닝)
- 세션 토큰을 서버에서 검증해 SSR 보호하는 완전한 Auth 아키텍처

## Test Plan

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run test:integration`
- `npm run test:e2e:mvp`
- `npm run build`

## Rollback Plan

- `useSupabaseSession` 및 각 페이지의 Bearer fallback 변경 revert

