# WI-0958: 직원 온보딩 가이드 페이지 개선

## 목적

- 신규 직원이 입사 첫 주에 자주 사용하는 셀프서비스 기능을 빠르게 익히도록 `/employee/guide` 화면을 안내형 페이지로 개선한다.

## 범위

- 대상 파일:
  - `src/app/employee/guide/page.tsx`
- 포함 안내:
  - 출퇴근 기록 방법
  - 휴가 신청 방법
  - 급여명세서 확인 방법
  - 계약서 확인 방법
- 추가 섹션:
  - 첫 주 체크리스트
  - 문의/공지 확인 가이드

## 구현 내용

- 기존 `EmployeeGuideDashboard` 래퍼 렌더링 대신 `page.tsx`에서 온보딩 가이드를 직접 렌더링하도록 변경.
- 히어로 영역에 페이지 목적, 권장 소요 시간, 권장 진행 순서, 직원 홈 이동 링크 추가.
- 4개 업무 카드(출퇴근/휴가/급여명세서/계약서)에 대해 아래 항목 구성:
  - 업무 요약
  - 단계별 진행 방법
  - 시작 전 확인 사항
  - 즉시 이동 CTA
- CTA 링크:
  - `/employee?focus=attendance`
  - `/employee?focus=leave`
  - `/employee/payslips`
  - `/employee/contracts`
- 하단에 첫 주 체크리스트와 문의/공지 확인 섹션 배치:
  - 공지 게시판 링크: `/employee/notices`
  - 요청 타임라인 링크: `/employee?focus=request-timeline`

## 테스트

- `npm.cmd run typecheck`
- `npm.cmd run lint`

## 검증 포인트

- `/employee/guide` 진입 시 한국어 온보딩 가이드가 정상 렌더링된다.
- 4개 CTA가 지정한 경로로 이동한다.
- 첫 주 체크리스트와 문의/공지 섹션이 함께 노출된다.
- 모바일 뷰(좁은 화면)에서 패널이 1열로 정렬되어 읽기 가능하다.
