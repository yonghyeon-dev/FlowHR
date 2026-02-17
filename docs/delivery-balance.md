# Delivery Balance Policy

Date: 2026-02-17

## 목적

FlowHR는 contract-first 품질을 유지하되, 사용자 가치(UI/사용자 흐름)와 백엔드 안정화가 함께 전진하도록 균형을 강제합니다.

## 강제 규칙

1. 최근 3개 WI 기준 최소 1개는 UI/UX 가시 기능이어야 합니다.
2. 백엔드 전용 WI는 연속 2개를 초과할 수 없습니다.
3. 백엔드 전용 PR은 예외 사유와 다음 UI WI를 반드시 지정해야 합니다.
4. 긴급(Break-glass) PR을 제외하고 UI 영향 검토 없이 병합할 수 없습니다.

## PR 게이트

- `.github/PULL_REQUEST_TEMPLATE.md`의 `Delivery Balance` 섹션을 필수로 채웁니다.
- `scripts/ci/check_pr_template.py`가 아래를 검증합니다.
  - UI 변경 체크 또는 Backend-only 예외 체크 중 최소 1개
  - UI 변경 체크 시 `UI changed files` 필수
  - Backend-only 예외 체크 시 `Backend-only reason`, `Next UI WI` 필수

## 운영 예외

- 보안/장애 핫픽스는 예외 가능
- 단, 머지 후 48시간 이내에 상쇄 UI WI를 생성하고 `Next UI WI`에 연결합니다.

## 즉시 적용 백로그 순서

1. WI-0081: 관리자 UI 정보구조 정리 + 핵심 대시보드 시각 개선
2. WI-0082: 직원 셀프서비스(출퇴근/휴가 신청) 화면 baseline
3. WI-0083: UI 흐름 e2e(주요 사용자 여정) 추가
