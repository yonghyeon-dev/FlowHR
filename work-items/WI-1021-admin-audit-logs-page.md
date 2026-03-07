# WI-1021: 관리자 감사로그 페이지

## Background and Problem
`/admin/audit-logs` 페이지가 존재하지 않음. API(`/api/admin/audit-logs`)는 있고 CSV 내보내기도 지원하지만 UI가 없음.

## Scope

### In Scope
- `src/app/admin/audit-logs/page.tsx` 생성
- 감사로그 테이블: 시간, 엔티티 유형, 엔티티 ID, 액션, 수행자, 변경 내용
- 날짜 범위 필터 (from/to)
- 엔티티 유형 필터 드롭다운
- 페이지네이션 (limit=50)
- CSV 내보내기 버튼
- `useSupabaseSession()` 세션 가드 적용

### Out of Scope
- 실시간 로그 스트리밍
- 로그 상세 모달
- 새 API 엔드포인트 추가

## Implementation Notes
- API: `GET /api/admin/audit-logs?from=&to=&entityType=&limit=50&offset=0`
- CSV 내보내기: 같은 API에 Accept: text/csv 또는 별도 파라미터
- `src/app/api/admin/audit-logs/shared.ts`의 `toAuditLogsCsv()` 참고
- 기존 패턴: `admin/analytics/page.tsx` 수준의 대시보드 페이지
- 500줄 상한 준수
- 레이아웃: `src/app/admin/layout.tsx`의 네비게이션에 "감사로그" 링크 추가

## Test Plan
- 페이지 렌더링 확인
- 감사로그 목록 표시 확인
- 날짜 필터 동작 확인
- CSV 내보내기 동작 확인
- 비관리자 접근 차단 확인

## ADR
- 기존 API 그대로 사용, UI만 추가
