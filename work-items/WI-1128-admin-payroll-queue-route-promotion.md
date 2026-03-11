# WI-1128: 관리자 급여 큐 서브라우트 승격

## 배경

관리자 대시보드와 분석 패널의 급여 큐 링크는 아직 `?focus=` 쿼리로
`/admin/payroll-close` 와 `/admin/payroll-payslip-delivery` 를 열고 있습니다.
하지만 현재 구현에서 이 값은 실제 작업면을 바꾸지 않고, 배너 라벨만 바꿉니다.

이 구조는 다음 모순을 남깁니다.

- 같은 링크가 실제 목적지가 아니라 화면 설명 문자열만 바꾼다.
- `previewed`, `undistributed` 같은 큐 상태가 안정적인 route 로 표현되지 않는다.
- 대시보드와 KPI 드릴다운이 route-first IA 기준을 어긴다.

## 목표

- 관리자 급여 큐의 대표 진입점을 실제 서브라우트로 승격한다.
- 기존 `?focus=` 링크는 호환 리다이렉트로 정리한다.
- 급여 마감과 명세 배포가 각각 소유하는 큐 상태를 더 명확하게 나눈다.

## 범위

### In Scope

- `/admin/payroll-close/previewed`
- `/admin/payroll-payslip-delivery/undistributed`
- 기존 `?focus=` 링크의 route-first 리다이렉트
- 관리자 대시보드 / KPI 패널 링크 정렬
- 회귀 가드 추가

### Out of Scope

- 급여 마감 / 명세 배포 화면 전체 리디자인
- 연말정산 / 신고 흐름 개편
- 급여 큐 외 다른 admin route-first 추출

## 완료 기준

1. 관리자 대시보드와 KPI 패널이 더 이상 `?focus=` 기반 급여 큐 링크를 만들지 않는다.
2. 레거시 `?focus=` 진입은 새 서브라우트로 리다이렉트된다.
3. 새 서브라우트가 명시적인 `queueMode` 를 사용해 콘솔을 렌더한다.
4. 관련 회귀 테스트가 CI에 추가된다.
