# WI-0967: 직원 휴가 캘린더(본인 + 동일 부서) 개선

## 배경

직원 셀프서비스의 `leave-calendar` 뷰는 본인 휴가 위주로만 표시되어 같은 부서 동료 부재 일정을 한 화면에서 확인하기 어렵다.  
월간 캘린더에서 본인 + 동일 부서 동료 휴가를 함께 보여주고, 승인 상태를 색상으로 즉시 구분할 수 있도록 개선한다.

## 범위

### 포함

- `src/app/employee` leave-calendar 뷰를 본인 + 동일 부서 동료 데이터 기반으로 확장
- 직원 전용 부서 휴가 캘린더 API 추가: `GET /api/leave/calendar/employee`
- 상태 색상 구분 적용
  - 대기: 노랑
  - 승인: 초록
  - 반려: 빨강
- 캘린더 셀/리스트에 직원명(본인 `나` 표기) 표시
- 한국어 안내 문구 보강(동일 부서 범위 안내, 상태 범례)
- leave 도메인 스펙 문서(`contract.yaml`, `api.yaml`, `test-cases.md`) 업데이트
- WI 검증용 e2e 테스트 추가

### 제외

- 관리자 `/admin/leave-calendar` 동작 변경
- 승인 정책/결재선 로직 변경
- 외부 캘린더 동기화

## 구현 요약

- `src/features/leave/employee-calendar-service.ts`
  - 직원 본인 액터를 기준으로 조직/부서 범위를 계산한다.
  - 본인과 동일 부서 직원의 휴가 요청(대기/승인/반려)을 월간 구간으로 조회한다.
  - 일자별 집계(`approvedCount/pendingCount/rejectedCount`)와 엔트리 목록을 함께 반환한다.
  - 감사 로그(`leave.employee_calendar_read`)를 기록한다.

- `src/app/api/leave/calendar/employee/route.ts`
  - `from`, `to` 쿼리 검증 후 직원 전용 캘린더 서비스를 호출한다.

- `src/app/employee/*`
  - snapshot 갱신 시 `/api/leave/calendar/employee`를 함께 조회한다.
  - leave-calendar 셀에 직원 이벤트 칩(본인/동료 + 상태색)을 노출한다.
  - 하단 목록에 `직원명 · 휴가유형/단위`와 상태 배지를 표시한다.
  - 한국어 copy 및 API 라벨을 확장한다.

## 테스트

- `npm.cmd run typecheck`
- `npm.cmd run lint` (기존 경고 유지)
- `npx tsx scripts/tests/e2e-wi0967-employee-leave-calendar-department-view.test.ts`

## 검증 시나리오

- 직원이 `/employee`의 `leave-calendar`에서 본인 + 같은 부서 동료 일정을 월간 단위로 확인한다.
- 셀/목록 상태 색상이 대기(노랑), 승인(초록), 반려(빨강)으로 표시된다.
- 다른 부서 직원 휴가는 노출되지 않는다.
- 캘린더 날짜 클릭 시 기존 휴가 신청 폼 자동 입력 동작은 유지된다.

## 롤백 계획

- `src/app/api/leave/calendar/employee/route.ts` 및 `src/features/leave/employee-calendar-service.ts`를 제거한다.
- employee snapshot에서 `leaveDepartmentCalendar` 호출을 제거하고 기존 leave 요청 기반 캘린더로 복귀한다.
- leave-calendar UI의 상태 범례/이벤트 칩 렌더링을 원복한다.

## ADR

- Not required: 기존 leave 도메인 내부에 직원 조회 범위를 추가한 기능 확장으로, 아키텍처 경계/데이터 저장 구조/외부 계약 파괴 변경이 없다.
