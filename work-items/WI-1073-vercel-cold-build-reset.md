# WI-1073: Vercel 콜드 빌드 초기화

## 배경
- `WI-1064` 이후 `vercel-production-deploy`가 연속 실패하고 있다.
- 실패 로그는 `Restored build cache from previous deployment` 직후 `next build`가 `SIGKILL` / `OOM`으로 종료되는 패턴이다.
- `WI-1069` ~ `WI-1072`로 빌드 범위와 엔트리를 줄였지만, 아직 cached build 경로는 그대로 실패한다.

## 목표
- production deploy가 Vercel build cache 없이 콜드 빌드로 실행되게 바꾼다.
- 캐시 기인 OOM인지 즉시 판별 가능한 상태를 만든다.

## 범위
- `.github/workflows/vercel-production-deploy.yml`
- `scripts/tests/e2e-wi1073-vercel-cold-build-reset.test.ts`

## 완료 조건
1. production deploy workflow가 `vercel deploy --prod --yes --force`로 실행된다.
2. 회귀 가드가 cold deploy 구성을 검증한다.
3. `PR -> CI -> main merge -> branch delete -> production deploy`까지 닫는다.
