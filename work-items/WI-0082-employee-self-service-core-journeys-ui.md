# WI-0082: Employee Self-Service Core Journeys UI

## Background and Problem

직원 셀프서비스 UI가 부재해 관리자 의존도가 높고 처리 리드타임이 길어집니다.
Shift/Flex 대비 상위호환을 위해 직원이 직접 처리 가능한 핵심 여정(출퇴근 정정, 휴가 신청)을 우선 제공합니다.

## Scope

### In Scope

- 직원 포탈 baseline 화면 추가(`employee` 경로군):
  - 오늘 근무 상태
  - 휴가 잔여/신청 버튼
  - 출퇴근 정정 요청 시작점
- 휴가 신청/취소 기본 폼 UI
- 출퇴근 정정 요청 폼 UI(사유 포함)
- 권한 기반 접근 제어(직원/관리자 구분)

### Out of Scope

- 모바일 네이티브 앱
- 복잡한 전자결재 라우팅
- 급여 명세서 상세 UI

## User Scenarios

1. 직원은 90초 내 휴가 신청을 완료할 수 있다.
2. 직원은 출퇴근 기록 이상을 발견하면 정정 요청을 제출할 수 있다.
3. 관리자는 직원 포탈 경로에 접근 시 관리자 전용 화면으로 리다이렉트된다.

## Data Changes (Tables and Migrations)

- 없음 (기존 leave/attendance API 재사용)

## API/Event Changes

- 기존 API 사용:
  - `POST /leave/requests`
  - `PATCH /leave/requests/{id}`
  - attendance 관련 수정/반려 API
- UI audit event 추가 검토:
  - `ui.employee.leave.requested`
  - `ui.employee.attendance.correction.requested`

## Test Plan

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run test:integration`
- 직원 여정 수동 점검(휴가 신청/취소, 정정 요청)

## Observability

- KPI: `employee_self_service_median_seconds` baseline 산출
- 직원 셀프서비스 완료율(시작 대비 완료)을 기록

## Rollback Plan

- WI-0082 UI 커밋 revert
- 직원 포탈 라우트 비활성화
