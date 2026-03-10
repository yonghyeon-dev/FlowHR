# WI-1116: 관리자 워크스페이스 허브 셸 정렬

## 배경

`WI-1108`, `WI-1109`로 관리자 셸과 대시보드 진입 축을 grouped shell 기준으로 정리했지만,
대시보드의 workspace hub는 여전히 별도 분류와 카피 체계를 사용하고 있었습니다.

이 상태를 두면 다음 문제가 반복됩니다.

- 관리자 셸과 대시보드 허브가 서로 다른 정보구조를 갖게 된다.
- 운영 설정, 공지/복리후생/채용 위험 진입점이 허브 개편 중 누락될 수 있다.
- control tower, people, operations, payroll, settings 축이 제품 전체에서 같은 방식으로 인지되지 않는다.

## 목표

- 관리자 대시보드 허브를 `admin-shell-navigation.ts`의 grouped shell 정의에 맞춘다.
- 허브 제목은 셸 그룹 제목과 같은 번역 키를 사용한다.
- 기존 운영 설정 제품화 슬라이스와 대시보드 위험 진입 링크를 잃지 않는다.
- 이후 IA 리팩토링에서 셸과 허브가 같은 분류 체계를 공유하도록 기준을 고정한다.

## 범위

### In Scope

- `src/app/admin/page-workspace-hubs.ts`를 grouped shell 기준으로 재구성
- 허브 제목을 `ADMIN_SHELL_SECTION_DEFINITIONS` 기반으로 정렬
- 아래 5개 허브 축을 셸과 동일하게 고정
  - `controlTower`
  - `peopleAndPolicy`
  - `operations`
  - `payrollAndFiling`
  - `settingsAndReporting`
- 운영 설정 링크 복원
  - `/admin/approval-escalation-settings`
  - `/admin/leave-promotion-email`
  - `/admin/attendance-security`
  - `/admin/operator-alerts`
  - `/admin/notification-defaults`
  - `/admin/feature-management`
- 공지/복리후생/채용의 대시보드 source-context 위험 링크 복원
- 회귀 가드 추가 및 기존 stale guard 정렬

### Out of Scope

- 개별 워크스페이스 내부 IA 리팩토링
- 신규 관리자 화면 추가
- employee shell 구조 변경

## 구현 메모

- 대시보드 허브는 셸 그룹 이름을 재사용하되, 허브 설명과 링크 구성은 운영형 허브에 맞게 별도 정의한다.
- 셸 navigation의 단순 nav link와 대시보드 허브의 우선순위 링크는 완전히 같을 필요는 없지만, 분류 체계와 핵심 진입점은 일치해야 한다.
- 운영 설정 제품화 WI-1055와 공지/복리후생/채용 source-context WI-0859를 회귀 기준으로 유지한다.

## 검증

- `npm run typecheck`
- `npm test`
- `npm run test:integration`
- `npx tsx scripts/tests/e2e-wi0836-admin-dashboard-contract-risk-links.test.ts`
- `npx tsx scripts/tests/e2e-wi0859-admin-communication-hub-source-context.test.ts`
- `npx tsx scripts/tests/e2e-wi1116-admin-workspace-hub-shell-alignment.test.ts`
