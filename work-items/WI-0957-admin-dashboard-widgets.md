# WI-0957: 관리자 대시보드 핵심 위젯 개선

## Scope
- `src/app/admin/page.tsx`에 관리자 대시보드 핵심 위젯 카드 3종 추가
- 카드 레이블을 한국어로 고정
  - `오늘 출근 인원수`
  - `대기 승인 건수`
  - `이번 달 휴가 건수`

## Implementation
- 대시보드 새로고침 시 추가 데이터 로드
  - 당일 출근 인원 계산용: `GET /api/attendance/records?from=...&to=...`
  - 월간 휴가 건수 계산용: `GET /api/leave/requests?from=...&to=...`
- 위젯 수치 계산 방식
  - 오늘 출근 인원수: 당일 출근 기록의 `employeeId` 유니크 개수
  - 대기 승인 건수: 기존 요약 값 `summary.pendingApprovalExecutionCount`
  - 이번 달 휴가 건수: 월간 휴가 요청 배열 길이
- 로그인 세션이 필요한 런타임에서 세션이 없을 경우 위젯 값 초기화(0 처리)

## Test
- `npm.cmd run typecheck`
- `npm.cmd run lint`

## Verification
- 관리자 대시보드(`/admin`) 진입 시 `핵심 위젯` 섹션이 카드 형태로 노출되는지 확인
- 카드 레이블이 한국어로 표시되는지 확인
- 새로고침 버튼 클릭 시 값이 갱신되는지 확인
