# WI-1071: Next 빌드 워커 수 제한

## Background
- `WI-1070`로 webpack build worker와 memory optimization을 켰지만, Vercel production deploy는 여전히 `npm run build` OOM으로 실패했다.
- Next config는 `experimental.cpus`와 `experimental.memoryBasedWorkersCount`를 제공한다.
- 현재는 worker fan-out이 Vercel의 메모리 한계에 비해 높을 가능성이 있다.

## Goal
- Next production build의 worker 동시성을 더 낮춰 Vercel build OOM을 완화한다.

## Scope
- `next.config.ts`
- `scripts/tests/e2e-wi1071-next-build-worker-count-throttle.test.ts`

## Non-Goals
- 앱 기능 로직 변경
- 대형 페이지 분해
- 배포 워크플로 수정

## Acceptance Criteria
1. `next.config.ts`에 `cpus: 1`, `memoryBasedWorkersCount: true`가 반영된다.
2. 관련 회귀 가드가 추가된다.
3. `npm run build`, `npm run typecheck`, `npm test`, `npm run test:integration`이 통과한다.
4. PR CI, `main` 머지, 브랜치 삭제 후 `vercel-production-deploy`를 재확인한다.
