# WI-1070: Next 빌드 워커 메모리 최적화

## Background
- `WI-1069`로 Next build lint/typecheck 범위를 `src` 중심으로 줄였지만, production deploy는 여전히 Vercel build OOM으로 실패했다.
- Next 15 config 정의에서 `experimental.webpackBuildWorker`와 `experimental.webpackMemoryOptimizations`는 빌드 메모리 사용을 줄이기 위한 공식 옵션으로 제공된다.
- 같은 정의에서 `parallelServerCompiles`, `parallelServerBuildTraces`는 더 빠른 대신 메모리를 더 사용한다고 명시되어 있다.

## Goal
- Next production build를 메모리 절감 설정으로 고정한다.
- Vercel production deploy가 더 이상 `npm run build` OOM으로 죽지 않도록 완화한다.

## Scope
- `next.config.ts`
- `scripts/tests/e2e-wi1070-next-build-worker-memory-optimization.test.ts`

## Non-Goals
- 앱 기능 로직 변경
- 대형 서비스 파일 분해
- 배포 워크플로 자체 재설계

## Acceptance Criteria
1. `next.config.ts`에 메모리 절감용 Next build 옵션이 명시된다.
2. 관련 회귀 가드가 추가된다.
3. `npm run build`, `npm run typecheck`, `npm test`, `npm run test:integration`이 통과한다.
4. PR CI, `main` 머지, 브랜치 삭제 후 `vercel-production-deploy`를 재확인한다.
