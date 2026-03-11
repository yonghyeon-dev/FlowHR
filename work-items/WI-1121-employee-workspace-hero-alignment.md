# WI-1121: 직원 작업면 헤더와 진입 맥락 정렬

## 배경

`WI-1117`부터 `WI-1120`까지 employee 영역을 route-first로 나눴지만,
전용 작업면의 hero/header와 진입 맥락은 아직 화면마다 제각각입니다.

현재 문제:

- `/employee/requests`, `/employee/attendance`, `/employee/leave`, `/employee/schedule`가 서로 다른 hero 구조를 사용합니다.
- Today, guide, requests, schedule에서 들어왔을 때 source hint와 돌아가기 CTA가 일관되지 않습니다.
- route-first 구조로 옮긴 뒤에도 일부 링크가 source query 없이 이동해, 사용자가 어디에서 왔는지 맥락이 끊깁니다.

## 목표

- employee 전용 작업면의 hero/header를 공통 컴포넌트 기준으로 맞춥니다.
- dashboard / guide / requests / schedule에서 들어온 source context를 일관되게 표시합니다.
- 주요 진입 링크가 source query를 유지해 돌아가기 UX와 맥락 힌트가 안정적으로 이어지게 합니다.

## 범위

### In Scope

- 공통 `EmployeeWorkspaceHero` 도입 및 attendance / leave / requests / schedule 정렬
- employee workspace source-context resolver 확장
- Today / guide / requests / schedule handoff 링크의 source query 정렬
- 관련 회귀 가드 추가 및 기존 stale guard 보정

### Out of Scope

- schedule workspace 내부 필터/리스트 UI 재설계
- admin workspace hero 정렬
- 공통 toast / banner primitive 도입

## 완료 기준

1. employee 전용 작업면이 공통 hero 컴포넌트를 사용한다.
2. Today / guide / requests / schedule에서 들어오면 source hint와 return CTA가 맞게 보인다.
3. 핵심 진입 링크가 source query를 포함한다.
4. `npm run typecheck`, `npm test`, `npm run test:integration`이 통과한다.
