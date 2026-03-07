# WI-1022: 관리자 리포트 페이지

## Background and Problem
`/admin/reports` 페이지가 존재하지 않음. API(`/api/admin/reports/overtime`, `/api/admin/reports/attendance/department-summary`, 각종 export)는 있으나 통합 UI가 없음.

## Scope

### In Scope
- `src/app/admin/reports/page.tsx` 생성
- 탭 기반 인터페이스: 초과근무 | 근태 요약 | 휴가 | 급여
- 초과근무 탭: 기간 선택(월/분기/연), 부서 필터, 결과 테이블, CSV 내보내기
- 근태 요약 탭: 날짜 범위, 부서별 요약 테이블, CSV 내보내기
- 휴가/급여 탭: 날짜 범위 선택, CSV 내보내기 버튼
- `useSupabaseSession()` 세션 가드 적용

### Out of Scope
- 차트/그래프 시각화 (향후)
- 새 API 엔드포인트 추가

## Implementation Notes
- API 엔드포인트:
  - `GET /api/admin/reports/overtime?period=monthly&year=2026&month=3&limit=50`
  - `GET /api/admin/reports/attendance/department-summary?from=&to=`
  - `GET /api/admin/reports/leave/export`
  - `GET /api/admin/reports/overtime/export`
  - `GET /api/admin/reports/payroll/export`
- `src/app/api/admin/reports/shared.ts`의 CSV 헬퍼 참고
- 페이지가 복잡할 수 있으므로 탭별 로직을 `page-report-*.ts` 헬퍼로 분리하여 500줄 상한 준수
- 레이아웃: `src/app/admin/layout.tsx`의 네비게이션에 "리포트" 링크 추가

## Test Plan
- 페이지 렌더링 확인
- 각 탭 전환 동작 확인
- 초과근무 데이터 표시 확인
- CSV 내보내기 동작 확인
- 비관리자 접근 차단 확인

## ADR
- 탭 인터페이스로 통합, 헬퍼 파일로 500줄 상한 준수
