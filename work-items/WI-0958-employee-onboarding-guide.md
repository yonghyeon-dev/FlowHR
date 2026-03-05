# WI-0958: 직원 온보딩 가이드 페이지 개선

## 배경

신규 직원이 입사 후 셀프서비스 기능을 빠르게 익힐 수 있도록 `/employee/guide`를 실사용 중심 안내 페이지로 정리한다.

## 범위

### 포함

- `src/app/employee/guide/page.tsx`를 한국어 온보딩 가이드로 개선
- 다음 4개 업무에 대한 단계별 사용 안내 제공
  - 출퇴근 기록/정정 요청
  - 휴가 신청/잔여일 확인
  - 급여명세서 조회
  - 근로계약서 확인
- 각 안내 섹션에 바로가기 링크와 유의사항 제공

### 제외

- 출퇴근/휴가/급여/계약 기능의 백엔드 로직 변경
- 신규 API 추가 및 데이터 모델 변경

## 구현 요약

- 기존 `EmployeeGuideDashboard` 렌더링 대신, 페이지 내에서 온보딩 전용 콘텐츠를 직접 구성
- `hero-panel` + `panel-grid` 레이아웃으로 입사 초기 핵심 태스크를 순차 학습할 수 있도록 구성
- 기능별 실행 단계(4-step), 주의사항, CTA 링크를 묶어 셀프서비스 동선을 단순화

## 테스트

- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npx tsx scripts/tests/e2e-wi0958-employee-onboarding-guide.test.ts`

## 검증 시나리오

- `/employee/guide` 진입 시 한국어 온보딩 제목/설명이 표시된다.
- 출퇴근/휴가/급여명세서/계약서 4개 섹션이 순서대로 표시된다.
- 각 섹션의 바로가기 버튼이 해당 직원 메뉴로 이동한다.

## 롤백 계획

- `src/app/employee/guide/page.tsx`를 이전 `EmployeeGuideDashboard` 렌더링 방식으로 복원한다.
- 본 WI 문서를 삭제한다.
