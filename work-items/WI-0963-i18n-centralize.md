# WI-0963: i18n 메시지 중앙화

## 배경

알림 설정/온보딩/설정 관련 UI 및 API에서 한국어 문자열이 feature 파일에 분산되어 있었다.
문자열 변경 및 다국어 확장 시 중복 수정이 발생하므로 `src/lib/i18n/messages.ts`로 메시지를 중앙화해야 한다.

## 범위

### 포함

- `src/lib/i18n/messages.ts`에 notifications/onboarding/settings 키 추가(ko/en)
- `src/app/employee/notifications/settings/page.tsx`의 한국어 하드코딩을 `t(...)` 호출로 이관
- `src/app/api/admin/onboarding/tasks/route.ts` 기본 온보딩 태스크 제목 하드코딩을 메시지 키 기반으로 이관
- WI-0963 회귀 테스트 추가

### 제외

- `src/components/admin-onboarding/copy.ts` 전체 카피 구조 개편
- 신규 번역 로딩/보간 시스템 도입
- 알림 설정 서버 저장소 연동

## 구현 요약

- `messages.ts`
  - 온보딩 API 라벨/오류, 온보딩 기본 태스크 제목, 알림 설정 UI 문구 키를 추가했다.
- `employee/notifications/settings/page.tsx`
  - `useI18n`를 사용해 모든 표시 문구를 메시지 키로 치환했다.
  - 저장 시각 표시 함수는 런타임 로케일(`ko-KR`/`en-US`) 기반으로 동작하도록 정리했다.
- `api/admin/onboarding/tasks/route.ts`
  - 온보딩 기본 태스크 제목 배열을 `translate(DEFAULT_LOCALE, key)` 결과로 생성하도록 변경했다.
- `scripts/tests/e2e-wi0963-i18n-centralize.test.ts`
  - 메시지 키 존재, feature 파일의 하드코딩 한글 제거, WI 문서 존재를 검증한다.

## 테스트

- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npx tsx scripts/tests/e2e-wi0963-i18n-centralize.test.ts`

## 검증 시나리오

- `/employee/notifications/settings`에서 기존 알림 설정 UI 문구가 정상 노출된다.
- 알림 설정 토글/자동 저장 동작은 기존과 동일하게 유지된다.
- 온보딩 기본 태스크 생성 API 호출 시 기본 태스크 제목이 정상 생성된다.

## 롤백 계획

- `messages.ts`의 WI-0963 키를 제거한다.
- `employee/notifications/settings/page.tsx`를 변경 전 하드코딩 방식으로 복구한다.
- `api/admin/onboarding/tasks/route.ts`의 기본 태스크 제목 배열을 정적 문자열로 복구한다.
- `scripts/tests/e2e-wi0963-i18n-centralize.test.ts`와 본 WI 문서를 제거한다.
