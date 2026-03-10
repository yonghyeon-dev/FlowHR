# WI-1100: UI UX 2차 날짜 시간 상태 라벨 로컬라이징

## Background

- Epic E 1차 신뢰/복구 피드백 정리가 끝나면, 다음 신뢰 저하 요소는 날짜/시간 포맷과 혼합 언어 상태 라벨이다.
- 운영 표면에는 여전히 ISO 성격의 날짜 표기, 영어 상태 문구, 설명형 카피 혼합이 남아 있다.
- 이 축은 단발성 번역이 아니라 사용자 표면의 시간·상태 표현을 제품 언어로 통일하는 파동으로 다뤄야 한다.

## Scope

- 사용자와 운영자가 직접 보는 날짜/시간을 로컬 포맷으로 정리한다.
- 남아 있는 영문 상태 라벨과 혼합 언어 요약 카피를 한국어 제품 표현으로 정리한다.
- 이번 범위에서 다룬 날짜/상태 표면에 대한 회귀 가드를 추가한다.

## Candidate Surfaces

- admin reports / audit logs / notice-related timestamps
- remaining mixed-language status badges and summary strips
- adjacent Epic E surfaces selected during the implementation slice

## Acceptance Criteria

- 이번 범위의 날짜/시간 표기는 사용자 로컬 포맷 기준으로 일관된다.
- 이번 범위의 상태 라벨은 한국어 사용자 표면에서 영문 enum이나 혼합 언어로 노출되지 않는다.
- 회귀 가드가 추가된다.

## Verification

- Targeted regression checks to be defined with the implementation slice
