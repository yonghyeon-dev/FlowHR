# WI-1191: 관리자 급여 프리플라이트와 신고 운영 후속 정리

## 배경

`WI-1190`으로 급여 레인 대표 작업면은 source-aware 흐름을 공유하게 되지만, 프리플라이트와 신고 운영 단계는 아직 동일한 레인 문맥을 끝까지 유지하지 못합니다.
이번 후속 WI에서는 급여 레인에서 프리플라이트와 신고 운영 단계까지 이어지는 보조 여정을 정리합니다.

## 범위

1. 연말정산 preflight와 filing ops가 `/admin/payroll` source를 유지한다.
2. 프리플라이트와 신고 운영 단계의 되돌아가기/보조 링크를 급여 레인 문맥에 맞춘다.
3. current quality gates에 관련 회귀 가드를 추가하거나 보강한다.

## 완료 조건

1. 급여 레인에서 preflight와 filing ops로 이어지는 보조 여정이 generic admin hub로 떨어지지 않는다.
2. 각 단계의 되돌아가기와 안내 문구가 같은 급여 레인 문맥으로 보인다.
3. 관련 current quality gates가 green이다.
