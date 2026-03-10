# WI-1069: Vercel 빌드 메모리 안정화

## Background
- `WI-1064` 이후 `vercel-production-deploy`가 연속 실패했다.
- 실패 지점은 Prisma migration 이후의 Vercel production deploy 단계였다.
- Actions 로그에서 `npm run build` 중 `SIGKILL`과 `Out of Memory (OOM)`가 반복 확인됐다.
- 현재 `tsconfig.json`은 `**/*.ts`, `**/*.tsx`를 전부 포함해 `scripts/tests`까지 Next build 타입체크 범위에 포함시킨다.

## Goal
- Next production build가 앱 소스만 대상으로 lint/typecheck 하도록 범위를 축소한다.
- 전체 저장소 타입체크는 기존 `npm run typecheck`로 계속 보장한다.
- 배포 실패 원인을 기능 코드가 아니라 빌드 설정 차원에서 제거한다.

## Scope
- `next.config.ts`
- `tsconfig.next.json`
- `scripts/tests/e2e-wi1069-vercel-build-memory-stabilization.test.ts`

## Non-Goals
- 앱 기능 로직 변경
- 기존 전체 저장소 `tsconfig.json` 축소
- CI 파이프라인 전면 개편

## Acceptance Criteria
1. `next build`가 `tsconfig.next.json`을 사용한다.
2. Next ESLint 범위가 `src`로 제한된다.
3. `npm run build`, `npm run typecheck`, `npm test`, `npm run test:integration`이 통과한다.
4. PR CI 통과 후 `main` 머지 및 브랜치 삭제까지 완료한다.
