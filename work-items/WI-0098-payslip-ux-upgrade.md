# WI-0098: 직원 급여 명세서 UX 고도화

## Background and Problem

직원 명세서 화면은 기본 조회/리스트만 제공해 실사용 시 탐색 비용이 큽니다.
SaaS 제품 관점에서 명세서는 "빠른 기간 전환 + 요약 + 상세 확인/인쇄" 흐름이 자연스러워야 합니다.

## Scope

### In Scope

- `/employee/payslips` UX 개선
  - 빠른 기간 버튼(이번 달/지난 달/최근 3개월)
  - 명세서 요약 KPI(건수/총지급/총공제/실지급 합계)
  - 명세서 선택/상세 패널
  - 선택 명세서 인쇄 버튼(`window.print`)과 ID 복사 버튼

### Out of Scope

- PDF 생성 서버 렌더링
- 세법/4대보험 상세 항목 엔진
- 전자문서 서명/보관

## Test Plan

- `npm run lint`
- `npm run typecheck`
- `npm test`
- (CI) `npm run test:integration`
- (CI) `npm run test:e2e:mvp`

