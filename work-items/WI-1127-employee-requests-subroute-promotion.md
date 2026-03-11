# WI-1127: 직원 요청 서브라우트 승격

## 배경

- `/employee/requests`는 전용 워크스페이스로 분리됐지만, 핵심 진입점이 아직 `#request-feedback`, `#request-search-sort`, `#request-timeline`, `#resubmit-workbench` 해시에 기대고 있다.
- 대시보드 우선 처리, 빠른 이동, focus 승격 규칙이 여전히 hash 목적지에 묶여 있어 route-first IA 기준과 어긋난다.

## 목표

1. 요청 모니터링과 재제출 워크벤치를 stable subroute로 승격한다.
2. 대시보드/빠른 이동/focus 승격 규칙이 hash 대신 stable route를 사용하도록 정렬한다.
3. 기존 requests workspace client는 재사용하되, route 별 section mode를 지원하도록 분리한다.

## 범위

- `src/app/employee/requests/page.tsx`
- `src/app/employee/requests/page-client.tsx`
- `src/app/employee/requests/monitoring/page.tsx`
- `src/app/employee/requests/resubmit/page.tsx`
- `src/app/employee/requests/workspace-content.tsx`
- `src/app/employee/page-query-prefill-helpers.ts`
- `src/components/employee-dashboard/EmployeeAccountOverviewPanels.tsx`
- `src/components/employee-self-service/EmployeeJourneyShortcutPanel.tsx`
- 관련 회귀 테스트

## 완료 기준

1. `/employee/requests/monitoring`과 `/employee/requests/resubmit`가 실제 route로 존재한다.
2. request-related focus 승격 규칙이 새 subroute를 사용한다.
3. 대시보드/빠른 이동이 더 이상 `/employee/requests#...`에 기대지 않는다.
4. CI 회귀 테스트가 새 route-first 구조를 기준으로 통과한다.
