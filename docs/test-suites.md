# 테스트 스위트 운영 기준

FlowHR는 **SaaS 제품 개발 속도(UI/휴가/급여/결재)** 를 우선하면서도, 회귀를 막기 위해 테스트를
스위트로 분리해서 운영합니다.

## 기본(머지 게이트): MVP 스위트

CI 및 기본 개발 루프에서는 아래만 돌립니다.

- 커맨드: `npm run test:e2e` (=`npm run test:e2e:mvp`)
- 범위: 인사(조직/직원) + 테넌시 + 근태/휴가/급여 수직 슬라이스 + 스케줄링 CRUD + UI 핵심 여정

## 전체(회귀/운영 기능 포함): Full 스위트

운영/관제(ops), anti-spoofing, anomaly/incident 등 **고급 기능**까지 포함한 전체 회귀 스위트입니다.

- 커맨드: `npm run test:e2e:full`
- 권장 실행 시점:
  - 큰 릴리즈 전
  - 기능 플래그를 실제로 켜기 전
  - 주기적(예: nightly) 회귀

## DB 연동(Prisma) 스위트

Supabase/Postgres 연결이 준비된 환경에서만 실행합니다.

- `npm run test:e2e:prisma`

