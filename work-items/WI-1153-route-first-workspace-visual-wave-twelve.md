# WI-1153: 운영 설정 워크스페이스 시각 파동 12

Visual wave 12 for route-first operational settings workspaces.

## Background

- `WI-1152`까지 admin/employee 기본 설정 워크스페이스가 공통 shell 기준으로 정렬됐다.
- 하지만 운영 설정군인 `leave-policies`, `attendance-security`, `feature-management`, `employee notifications/settings`는 아직 legacy layout과 분리된 히어로/카드 패턴이 혼재한다.
- 이 네 화면은 day-2 운영과 self-service 알림 기준을 함께 바꾸는 핵심 설정군이므로 같은 visual wave로 묶어 정렬하는 편이 자연스럽다.

## Scope

1. `src/app/admin/leave-policies/page.tsx`를 admin workspace shell 기준으로 정렬한다.
2. `src/app/admin/attendance-security/page.tsx`를 admin workspace shell 기준으로 정렬한다.
3. `src/app/admin/feature-management/page.tsx`를 admin workspace shell 기준으로 정렬한다.
4. `src/app/employee/notifications/settings/page.tsx`를 employee workspace shell 기준으로 정렬한다.
5. 운영 설정군 시각 회귀 가드를 추가하고 `test:integration`에 연결한다.
6. `WI-1152` 종료 기록과 `WI-1153` 시작 기록을 진행 문서에 반영한다.

## Non-Goals

- leave/attendance/feature-management API 계약 변경
- 알림 환경설정 저장 정책 변경
- ops 전용 인프라 플래그 구조 변경

## Acceptance Criteria

1. 네 화면 모두 `workspace-shell`, `workspace-page-header`, `workspace-summary-strip`, `workspace-section-card` 기준을 따른다.
2. admin 화면은 `/admin`, `/admin/settings` 복귀 동선을 갖고 employee 화면은 `/employee`, `/employee/settings` 복귀 동선을 갖는다.
3. 운영 설정 상태 요약이 상단 KPI strip에서 바로 보인다.
4. 관련 정적 가드, integration, typecheck, unit 테스트가 green이다.
