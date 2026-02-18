# Delivery Balance Policy

Date: 2026-02-17

## 목적

FlowHR는 contract-first 속도를 유지하되, 사용자 가치(UI/UX surface)와 백엔드 안정성/거버넌스를 균형 있게 배송한다.

## 강제 규칙

1. 최근 3개 WI 중 최소 1개는 UI/UX surface 변경을 포함해야 한다.
2. Backend-only WI는 연속 2개를 초과할 수 없다.
3. Backend-only PR은 예외 승인 근거와 다음 UI WI를 반드시 명시한다.
4. Break-glass(PR 긴급)도 UI 영향 검토 없이 병합할 수 없다.
   - UI와 무관한 P0/보안/법적 핫픽스는 Backend-only 예외로 처리하되, 사후 RCA 규칙은 유지한다.

## PR 게이트

- `.github/PULL_REQUEST_TEMPLATE.md`의 `## Delivery Balance` 섹션은 필수다.
- `scripts/ci/check_pr_template.py`가 아래를 검증한다.
  - UI changed 또는 Backend-only exception 중 최소 1개 체크
  - UI changed 체크 시 `UI changed files` 비어있지 않음
  - Backend-only exception 체크 시 `Backend-only reason`, `Next UI WI` 비어있지 않음

## 즉시 적용 백로그 (UI-first window)

1. WI-0081: 관리자 UI 정보 구조/우선 조치 큐 + KPI cockpit baseline
2. WI-0082: 직원 셀프서비스(휴가/정정) 기본 여정 UI
3. WI-0083: UI 여정 e2e + 회귀 차단 게이트

