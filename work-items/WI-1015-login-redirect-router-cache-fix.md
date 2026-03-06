# WI-1015: 로그인 리다이렉트 Next.js 라우터 캐시 우회

## Background and Problem

WI-1013에서 Employee 로그인 후 쿠키가 설정된 것을 확인한 뒤 `router.replace('/employee')`를 호출하도록 수정했으나 여전히 리다이렉트 지연(10초+)이 발생한다.

### 근본 원인 (디버깅 결과)

로그인 페이지 초기 로드 시 `useEffect`에서 기존 세션을 확인하며 `/employee?_rsc=...` RSC 요청이 발생한다. 이 시점에는 쿠키가 없어 middleware가 307로 `/login?redirect=/employee`로 리다이렉트한다.

**Next.js App Router는 이 307 응답을 클라이언트 라우터 캐시에 저장한다.** 이후 로그인 성공 후 `router.replace('/employee')`를 호출하면, 네트워크 요청 없이 캐시된 307 리다이렉트를 재사용하여 다시 `/login?redirect=/employee`로 돌아간다.

증거:
- 로그인 후 네트워크 로그에 `/employee` 요청이 없음 (캐시 히트)
- `page.goto('/employee')` (전체 페이지 네비게이션)은 200으로 정상 동작
- 쿠키는 1초 내에 정상 설정됨 (JWT 토큰 확인)

Admin은 정상인 이유: Admin의 경우 미들웨어가 role 없을 때 `/employee`로 리다이렉트하므로, 로그인 전에 `/admin` RSC 요청이 캐시되지 않는다.

## Scope

### In Scope

- `src/app/login/page.tsx`: `router.replace(loginSuccessTarget)` 대신 `window.location.href = loginSuccessTarget` 사용
- 이렇게 하면 전체 페이지 네비게이션이 발생하여 라우터 캐시를 우회함
- Admin 로그인도 동일하게 적용 (일관성)

### Out of Scope

- Next.js 라우터 캐시 설정 변경
- middleware 구조 변경
- 회원가입 플로우

## Test Plan

- `npm run typecheck`
- `npm run build`
- Employee 계정으로 로그인 → `/employee`로 3초 이내 리다이렉트 확인
- Admin 계정으로 로그인 → 기존과 동일하게 빠른 리다이렉트 확인
- 로그아웃 후 보호 페이지 접근 → 로그인 페이지로 리다이렉트 확인

## ADR

- Not required: 단순 navigation method 변경.
