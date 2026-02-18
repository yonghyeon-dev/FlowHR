# WI-0099: 급여 명세서 공제 상세 UX

## Background and Problem

현재 명세서 상세는 총지급/총공제/실지급 중심이라, 직원이 공제 산식(원천세/사회보험/기타)을 바로 확인하기 어렵습니다.
SaaS 제품 신뢰도를 위해 최소한의 공제 항목 상세를 명세서 화면에 표시해야 합니다.

## Scope

### In Scope

- `/employee/payslips` 명세서 상세에 공제 항목 노출
  - 원천세, 사회보험, 기타 공제
  - 공제 breakdown JSON이 있으면 요약 출력
- 명세서 다건 내보내기(CSV 다운로드) 버튼 추가

### Out of Scope

- 세법/4대보험 계산식 엔진 고도화
- 회사별 커스텀 급여 항목 편집기
- 정식 PDF 문서 생성

## Test Plan

- `npm run lint`
- `npm run typecheck`
- `npm test`
- (CI) `npm run test:integration`
- (CI) `npm run test:e2e:mvp`

