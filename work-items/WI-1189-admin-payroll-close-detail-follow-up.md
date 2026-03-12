# WI-1189: 관리자 급여 마감 상세 후속 정리

## 배경

`WI-1176`과 `WI-1177`로 `/admin/payroll` 레인과 급여 문서 후속 진입은 정리됐지만, 급여 마감 상세 화면은 아직 동일한 source-aware 흐름으로 정렬되지 않았습니다.
이번 후속 WI에서는 급여 마감 상세가 새 급여 레인과 같은 운영 문맥을 공유하도록 정리합니다.

## 범위

1. 급여 마감 상세 화면이 `/admin/payroll` source를 이해하고 되돌아가기 경로를 같은 레인으로 유지한다.
2. 급여 마감 copy, 배너, focus 문구를 급여 레인 기준으로 맞춘다.
3. current quality gates에 급여 마감 후속 흐름 회귀 가드를 추가한다.

## 완료 조건

1. `/admin/payroll-close`가 급여 레인 source에서 진입될 때 문맥 배너와 되돌아가기 액션이 일관되게 보인다.
2. 급여 마감 상세 표면이 generic admin hub fallback 대신 급여 레인 흐름을 우선한다.
3. 관련 current quality gates가 green이다.
