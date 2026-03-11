# WI-1139: 관리자 허브 상단 타이틀 정렬

## 배경

- `WI-1138`로 active source context와 배너 복귀 문구는 `admin-hub` 기준으로 정리했지만, 실제 사용자가 가장 먼저 보는 `/admin` 루트 타이틀과 랜딩 CTA는 아직 `관리자 대시보드`에 머물러 있다.
- 이 상태는 grouped shell과 route-first admin hub 구조를 이미 적용한 현재 제품 모델과 어긋난다.
- 온보딩 완료 안내도 같은 용어를 쓰고 있어, 첫 진입부터 허브와 대시보드가 혼재된 인상을 남긴다.

## 목표

- `/admin` 루트의 top-level 타이틀과 보조 문구를 `관리자 허브` / `Admin hub` 기준으로 정렬한다.
- 홈 랜딩의 관리자 CTA와 섹션 타이틀도 같은 용어로 맞춘다.
- 온보딩 완료 안내와 진입 버튼도 같은 허브 용어로 맞춘다.

## 범위

- `src/app/admin/page.tsx`
- `src/lib/i18n/messages.ts`
- `src/app/(protected)/onboarding/page.tsx`
- `scripts/tests/e2e-wi1139-admin-hub-title-alignment.test.ts`
- `package.json`
- `docs/production-operating-progress.md`

## 비범위

- `/admin` route 자체의 이름 변경
- legacy work item / historical 문서의 전체 용어 치환
- employee shell 카피 변경

## 완료 기준

1. `/admin` 루트 title과 landing 관리자 CTA가 `관리자 허브` / `Admin hub`를 사용한다.
2. 온보딩 완료 안내와 이동 버튼이 같은 허브 용어를 사용한다.
3. 새 회귀 가드가 추가되고 `npm test`, `npm run typecheck`, `npm run test:integration`을 통과한다.
4. PR CI, `main` CI, `vercel-production-deploy`까지 green으로 닫힌다.
