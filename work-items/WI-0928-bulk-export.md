# WI-0928 관리자 보고서 일괄 CSV 내보내기

## Scope
- 관리자 전용 CSV export API 3종 추가:
  - `GET /api/admin/reports/attendance/export`
  - `GET /api/admin/reports/leave/export`
  - `GET /api/admin/reports/payroll/export`
- 공통 요구사항:
  - `admin` role만 허용
  - `from`, `to` 쿼리 필수(ISO datetime, offset 포함)
  - CSV는 UTF-8 BOM 포함
  - `Content-Type: text/csv; charset=utf-8`
- 부서 필터:
  - attendance/leave export는 `departmentId` 선택 필터 지원

## Implementation
- 공통 유틸 추가:
  - `src/app/api/admin/reports/shared.ts`
  - 기능:
    - 관리자 인증/조직 스코프 검증
    - `from/to(/departmentId)` 쿼리 파싱 및 검증 (`from <= to`)
    - CSV escape/BOM 생성
    - 공통 파일명/이름 포맷팅 유틸
    - payroll deductionBreakdown의 중첩 숫자 추출 유틸

- 근태 export 라우트:
  - `src/app/api/admin/reports/attendance/export/route.ts`
  - 컬럼:
    - `employeeName,date,clockIn,clockOut,workHours,overtime,anomalyType`
  - `departmentId`가 있으면 해당 부서 직원으로 필터링
  - `workHours/overtime`는 분 단위를 시간 소수점(2자리)로 변환

- 휴가 export 라우트:
  - `src/app/api/admin/reports/leave/export/route.ts`
  - 컬럼:
    - `employeeName,leaveType,startDate,endDate,days,status,reason`
  - `departmentId`가 있으면 해당 부서 직원으로 필터링

- 급여 export 라우트:
  - `src/app/api/admin/reports/payroll/export/route.ts`
  - 컬럼:
    - `employeeName,basePay,overtime,totalDeductions,nps,nhi,ei,wci,incomeTax,localTax,netPay`
  - 현재 저장 구조(`grossPayKrw`, `totalDeductionsKrw`, `netPayKrw`, `deductionBreakdown.additional.components`)를 기준으로 금액을 추출
  - 누락 항목은 `0`으로 출력

## Test
- 추가:
  - `scripts/tests/e2e-wi0928-bulk-export.test.ts`
- 검증 내용:
  - 조직/부서/직원/근태/휴가/급여 데이터 셋업
  - 3개 export API 호출 시 `Content-Type`이 `text/csv`
  - CSV UTF-8 BOM 존재 확인
  - 각 CSV 헤더 컬럼 순서 검증
  - attendance/leave의 `departmentId` 필터 동작 확인
  - `employee` role 호출 시 3개 API 모두 `403`

## Verification
- `npm.cmd exec tsx scripts/tests/e2e-wi0928-bulk-export.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`

