# WI-1129: 직원 휴가 캘린더 서브라우트 승격

## 배경

- `/employee/leave`는 전용 작업 경로로 승격됐지만, 휴가 캘린더 진입은 아직 `/employee/leave#leave-calendar` 해시 링크에 기대고 있다.
- Today 바로가기와 요청 워크스페이스 링크가 아직 hash 목적지에 묶여 있어 route-first IA 기준과 어긋난다.
- 휴가 캘린더는 독립 deep-link가 필요한 실제 작업면이므로 stable subroute로 승격하는 편이 자연스럽다.

## 목표

1. `/employee/leave/calendar`을 휴가 캘린더 전용 서브라우트로 승격한다.
2. 기존 `?focus=leave-calendar`와 `/employee/leave#leave-calendar` 진입은 compatibility entry로만 남기고 stable route로 정렬한다.
3. 휴가 캘린더 경로에서도 캘린더 날짜 클릭 후 휴가 요청 작업을 이어갈 수 있도록 같은 leave workspace 맥락을 유지한다.

## 범위

- `src/app/employee/leave/page.tsx`
- `src/app/employee/leave/page-client.tsx`
- `src/app/employee/leave/calendar/page.tsx`
- `src/app/employee/attendance-leave-workspace-client.tsx`
- `src/app/employee/page-query-prefill-helpers.ts`
- `src/components/employee-self-service/EmployeeJourneyShortcutPanel.tsx`
- `src/app/employee/requests/workspace-content.tsx`
- 관련 회귀 테스트

## 완료 기준

1. `/employee/leave/calendar`이 실제 route로 존재한다.
2. `leave-calendar` focus 승격 규칙이 `/employee/leave/calendar`을 가리킨다.
3. 대시보드/요청 워크스페이스에서 더 이상 `#leave-calendar`에 직접 의존하지 않는다.
4. 기존 `/employee/leave#leave-calendar` 진입은 전용 route로 정리된다.
