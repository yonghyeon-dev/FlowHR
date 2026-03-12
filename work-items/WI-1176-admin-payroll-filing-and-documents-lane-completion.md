# WI-1176: 관리자 급여·신고 레인 완성

## 배경

`WI-1175`로 `/admin/operations`를 route-first 운영 레인으로 올렸지만, 급여 및 신고 묶음은 아직 `/admin/payroll-close` 중심의 하위 화면 집합으로 남아 있습니다.
이번 WI는 payroll, payslip delivery, year-end, filing, 문서 후속까지 하나의 customer-admin 레인으로 다시 묶어 `/admin/payroll`에서 시작하도록 정리합니다.

## 범위

1. `/admin/payroll` route를 신설한다.
2. 관리자 허브, 포커스 카드, 큐 링크, 워크스페이스 허브의 급여 진입점을 `/admin/payroll`로 통일한다.
3. 급여·명세서·정산·신고 후속 작업을 shared workspace primitives 기준의 lane 페이지로 정렬한다.
4. 현재 진실을 반영하는 정적 회귀 가드를 추가한다.

## 완료 조건

1. `/admin/payroll`가 queue-first payroll and filing lane으로 보인다.
2. admin shell의 payroll entry가 `/admin/payroll`로 연결된다.
3. 허브와 포커스 카드의 급여 진입점이 `/admin/payroll`로 통일된다.
4. `typecheck`, `lint`, `npm test`, `npm run test:e2e:mvp:current`, `npm run test:integration:current`, `npm run test:quality-gates:current`가 green이다.
