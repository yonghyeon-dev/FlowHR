# WI-1192: 급여 레인 신고 워크플로우 시각 후속 정리

## 배경

`WI-1191`으로 급여 레인 source가 연말정산 사전점검과 신고 ops 단계까지 이어지게 됐지만,
신고 워크플로우 단계 화면은 아직 급여 레인 시각 맥락과 작업 우선순위를 충분히 드러내지 못합니다.

## 범위

1. `/admin/payroll-year-end-filing`과 `/admin/payroll-year-end-filing/ops/[step]`의 시각 계층을 같은 급여 레인 기준으로 맞춘다.
2. 신고 워크플로우 단계 카드와 액션 그룹을 admin payroll lane rhythm에 맞춰 정리한다.
3. 현재 CI 기준에서 관련 stale guard가 있다면 같은 WI 안에서 함께 정리한다.

## 완료 조건

1. 신고 워크플로우 단계 화면이 급여 레인 source에서 열릴 때 같은 시각 맥락과 되돌아가기 액션을 유지한다.
2. 단계 카드의 제목, 설명, 액션 순서가 현재 admin payroll lane 기준과 맞는다.
3. 관련 current quality gates가 green이다.
