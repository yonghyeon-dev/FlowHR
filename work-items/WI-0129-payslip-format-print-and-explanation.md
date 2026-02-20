# WI-0129: Payslip Format, Print Layout, and Item Explanations

## Background and Problem

`/employee/payslips`는 조회/CSV 중심이라 실제 전달물로 쓰이는 명세서 서식(인쇄/PDF 저장) 품질과
공제 항목 설명력이 부족했습니다. 직원이 금액 근거를 이해하고 문서로 전달할 수 있도록
문서형 상세 패널과 인쇄 레이아웃을 강화합니다.

## Scope

### In Scope

- 직원 명세서 상세를 문서형 레이아웃으로 고도화
  - 문서 헤더/메타(직원 ID, 지급 기간, 확정일, 정산 상태)
  - 총지급/총공제/실지급 요약 카드
  - 공제 항목 설명(원천세, 사회보험, 기타 공제)
  - 법정공제 세부 구성 및 세액공제 참고 항목 설명
- PDF 전달형 UX 추가
  - `인쇄/PDF 저장` 액션
  - PDF 파일명 생성 및 클립보드 복사
- 인쇄 최적화 CSS 추가(`@media print`)
  - 사이드바/검색/액션 영역 숨김
  - 명세서 본문만 출력되도록 레이아웃 조정
- WI-0129 회귀 테스트 추가 및 e2e suite 연결

### Out of Scope

- 서버 측 PDF 생성 파이프라인 추가
- 급여 계산 엔진 규칙 변경
- 이메일/웹훅 배달 채널 확장

## User Scenarios

1. 직원은 선택한 명세서를 문서형 화면에서 확인하며 공제 항목 의미를 이해한다.
2. 직원은 브라우저 인쇄 기능으로 PDF를 저장하고 파일명을 복사해 전달한다.
3. 인쇄 시에는 명세서 본문만 출력되어 불필요한 UI가 제거된다.

## Data and API Changes

- DB 스키마 변경 없음
- API 스펙 변경 없음
- UI 렌더링/클라이언트 보조 기능만 강화

## Rollback Plan

- 문서형 패널/공제 설명/print stylesheet를 제거하고 기존 상세 리스트 UI로 복귀
- 계약/API/DB 변경이 없어 롤백은 프론트엔드 파일 기준 즉시 복원 가능
- Recovery target: 30m

## Definition of Done (DoD)

- [x] 명세서 상세가 문서형 레이아웃과 공제 설명 섹션을 제공한다.
- [x] `인쇄/PDF 저장` 및 PDF 파일명 복사 UX가 동작한다.
- [x] print media에서 명세서 본문 중심 출력이 동작한다.
- [x] WI-0129 e2e 회귀 테스트가 추가되고 스위트에 연결된다.
