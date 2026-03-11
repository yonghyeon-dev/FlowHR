# WI-1130: 직원 근태·휴가 주작업 서브라우트 승격

## 배경

`WI-1119`, `WI-1124`, `WI-1129`까지 진행하면서 직원 self-service의 요청 상태 확인, 일정, 휴가 캘린더는 route-first 구조로 옮겼다.

하지만 아직도 두 개의 핵심 작업은 해시 기반의 과거 목적지를 남겨두고 있다.

- `attendance` → `/employee/attendance#attendance`
- `leave` → `/employee/leave#leave`

이 구조는 다음 모순을 남긴다.

- deep-link가 실제 페이지가 아니라 패널 id에 기대고 있다.
- 스케줄 보드의 빠른 정정 CTA와 대시보드의 우선 처리 CTA가 안정적인 주작업 경로를 갖지 못한다.
- `/employee/leave/calendar`만 subroute가 생기고 정작 휴가 요청 본작업은 base route와 hash 혼합 상태로 남아 있다.

## 목표

1. 근태 정정 본작업을 `/employee/attendance/correction`으로 승격한다.
2. 휴가 요청 본작업을 `/employee/leave/request`로 승격한다.
3. 기존 `#attendance`, `#leave` 진입은 호환용 redirect만 남기고, 새 진입점은 stable route를 사용하게 만든다.
4. 대시보드, 요청 허브, 스케줄 보드의 주작업 링크를 새 route로 정렬한다.

## 범위

### In Scope

- `src/app/employee/attendance/page.tsx`
- `src/app/employee/attendance/page-client.tsx`
- `src/app/employee/attendance/correction/page.tsx`
- `src/app/employee/leave/page-client.tsx`
- `src/app/employee/leave/request/page.tsx`
- `src/app/employee/attendance-leave-workspace-client.tsx`
- `src/app/employee/page-query-prefill-helpers.ts`
- 직원 대시보드/요청 허브/스케줄 보드의 attendance/leave 진입 링크 정렬
- 관련 정적 가드와 integration 등록

### Out of Scope

- leave/attendance form 자체 UX 재설계
- Today 홈의 전체 IA 재편
- admin shell 구조 변경

## 완료 기준

1. `/employee/attendance/correction`과 `/employee/leave/request`가 실제 route로 존재한다.
2. `?focus=attendance`와 `?focus=leave`는 더 이상 hash 목적지를 사용하지 않는다.
3. legacy `#attendance`, `#leave` 진입은 새 subroute로 호환 redirect 된다.
4. 대시보드, 요청 허브, 스케줄 보드의 주작업 CTA는 새 subroute를 사용한다.
5. `npm run typecheck`, `npm test`, `npm run test:integration`이 통과한다.
