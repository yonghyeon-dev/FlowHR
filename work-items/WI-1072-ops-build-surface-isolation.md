# WI-1072: OPS 빌드 표면 분리

## 배경
- `WI-1064` 이후 `vercel-production-deploy`가 `npm run build` 단계에서 `SIGKILL` / `OOM`으로 연속 실패한다.
- `/ops/*` 라우트는 production에서 `NEXT_PUBLIC_FLOWHR_DEV_TOOLS`가 꺼져 있으면 숨겨지는 화면이지만, 라우트 엔트리 자체는 거대한 client page로 남아 있어 build 부담이 크다.

## 목표
- `/ops/admin-console`, `/ops/mvp-console`, `/ops/scheduling-cockpit` 라우트 엔트리를 서버 래퍼로 축소한다.
- production에서 dev tools가 꺼져 있으면 `notFound()`로 조기 종료하고, 실제 대형 client 콘솔은 `page-client.tsx`로 분리해 필요할 때만 로드한다.

## 범위
- `src/app/ops/devtools.ts`
- `src/app/ops/admin-console/page.tsx`
- `src/app/ops/admin-console/page-client.tsx`
- `src/app/ops/mvp-console/page.tsx`
- `src/app/ops/mvp-console/page-client.tsx`
- `src/app/ops/scheduling-cockpit/page.tsx`
- `src/app/ops/scheduling-cockpit/page-client.tsx`
- 관련 회귀 가드

## 완료 조건
1. 위 세 라우트의 `page.tsx`가 server wrapper로 바뀐다.
2. dev tools 비활성 시 `notFound()` 조기 종료가 유지된다.
3. 회귀 가드가 `page-client.tsx` 분리를 검증한다.
4. `PR -> CI -> main merge -> branch delete -> production deploy`까지 닫는다.
