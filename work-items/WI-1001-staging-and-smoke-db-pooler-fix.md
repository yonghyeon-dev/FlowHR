# WI-1001: Fix Staging CI and Production Smoke DB Connection Pooler

## Background and Problem
WI-0992 이후 main 브랜치의 CI가 13회 연속 실패 중. 원인은 `staging-prisma-integration` job에서 `MaxClientsInSessionMode` 에러 발생.

### 근본 원인
- GitHub staging 환경 secrets (`FLOWHR_STAGING_DATABASE_URL`, `FLOWHR_STAGING_DIRECT_URL`)가 session pooler(port 5432)를 사용 중
- session pooler는 CI 단발성 스크립트에서 MaxClients 제한에 걸림
- `production-auth-smoke` 워크플로우도 동일 문제 — `DATABASE_URL`이 session pooler를 가리켜 smoke 테스트의 PrismaClient가 실패
- Vercel production 앱의 `DATABASE_URL`도 session pooler → health check에서 `database: "down"` 반환

### 영향 범위
- CI: `staging-prisma-integration` 13연속 실패 (WI-0993~현재)
- production-auth-smoke: 이슈 #941 발생
- Vercel production: DB 연결 불가

## Scope

### In Scope
1. GitHub staging 환경 secrets 수정:
   - `FLOWHR_STAGING_DATABASE_URL` = session pooler(5432) — `prisma migrate deploy`용 (advisory locks 필요)
   - `FLOWHR_STAGING_DIRECT_URL` = transaction pooler(6543+pgbouncer) — `prisma db execute`/일반 쿼리용
2. `ci.yml`의 `prisma migrate deploy`에서 DIRECT_URL 오버라이드 제거 + `prisma db execute`도 DATABASE_URL로 복원 — WI-0992 성공 시점과 동일하게
3. `production-auth-smoke.yml`에서 smoke 테스트의 `DATABASE_URL`을 `FLOWHR_PRODUCTION_DIRECT_URL`(transaction pooler)로 오버라이드
4. Vercel production 환경변수 `DATABASE_URL`/`DIRECT_URL`을 transaction pooler로 변경

### Out of Scope
- 로컬 개발 환경 URL 변경
- Supabase 연결 풀 크기 튜닝
- ops 스크립트 자체 수정

## Data Changes
없음 (환경변수 및 워크플로우 설정 변경만)

## Test Plan
- [ ] `staging-prisma-integration` CI job 성공 (main push 시)
- [ ] `production-auth-smoke` 워크플로우 성공 (이슈 #941 자동 닫힘)
- [ ] Vercel production health endpoint `database: "up"` 반환
- [ ] 기존 CI jobs (contract-governance, quality-gates, golden-regression) 회귀 없음

## ADR
- session pooler(5432)는 advisory locks 지원하나, pool_size=15(Nano 플랜)로 Vercel+CI 동시 사용 시 MaxClients
- transaction pooler(6543+pgbouncer=true)는 advisory locks 미지원 → `prisma migrate deploy` hang
- direct connection(db.xxx:5432)은 외부(GitHub Actions/Vercel)에서 네트워크 차단됨
- **최종 결론**: staging CI에서 `prisma migrate deploy` 대신 `prisma db push` 사용
  - staging schema는 매번 DROP CASCADE → migration 이력 불필요
  - `prisma db push`는 advisory lock 미사용 → transaction pooler에서 정상 동작
  - DIRECT_URL도 DATABASE_URL과 동일 (transaction pooler) → session pooler 의존 완전 제거
  - enum bootstrap SQL도 불필요 (`db push`가 전체 schema 동기화)
