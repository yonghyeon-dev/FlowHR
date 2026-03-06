# WI-1012: 출산/배우자출산 휴가 정책 Migration 추가

## Background and Problem
WI-1009에서 출산(MATERNITY)/배우자출산(PATERNITY) 휴가 정책을 prisma/seed.ts에 추가했으나,
production 환경에서는 `prisma db seed`가 자동 실행되지 않아 정책이 반영되지 않음.
Migration으로 INSERT해야 production DB에 반영됨.

## Scope

### In Scope
- Prisma migration 추가: LeavePolicy 테이블에 MATERNITY, PATERNITY 정책 INSERT
- 기존 시드 데이터와 동일한 값 사용 (prisma/seed.ts 참조)
- idempotent: 이미 존재하면 skip (ON CONFLICT DO NOTHING)

### Out of Scope
- 시드 코드 변경
- 다른 정책 추가

## Data Changes
- Table: `LeavePolicy`
- Migration ID: `202603070001_wi1012_maternity_paternity_policy_migration`
- Insert statutory MATERNITY (90 days) and PATERNITY (10 days) policy rows for existing organizations.
- Update the leave contract migration list and bump the leave contract/api patch version.

## Test Plan
- `npx prisma migrate deploy` 성공
- GET /api/leave/policies 응답에 MATERNITY, PATERNITY 포함 확인

## ADR
- Migration에서 시드 데이터를 넣는 이유: production은 seed 미실행, deploy 시 migration만 자동 실행
