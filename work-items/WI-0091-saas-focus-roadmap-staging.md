# WI-0091: SaaS Focus Rebalance + Staging Build Safety

## Background and Problem

FlowHR는 HR SaaS 제품(UI 포함)이 목표인데, ops/관제 기능이 문서/노출 UI/테스트에서 과도하게 전면에 나오면서
제품 방향(직원/관리자 핵심 여정) 대비 체감 완성도가 낮아 보이는 문제가 있습니다.

또한 Vercel/Preview 빌드 환경에서 런타임 필수 env가 미설정일 때 `env.ts`가 import 시점에 throw 하며
배포 체크가 실패할 수 있습니다.

## Scope

### In Scope

- SaaS UI에서 ops 링크/기능을 기본적으로 숨김(`NEXT_PUBLIC_FLOWHR_DEV_TOOLS`로만 노출)
- env/supabase/prisma 초기화를 **lazy-init**로 변경하여 빌드 타임 실패를 방지
- `ROADMAP.md`, `docs/execution-plan.md`를 SaaS 우선순위에 맞게 정리 (UI/휴가/급여/결재를 전면)
- `CLAUDE.md`에서 FlowConsult 혼입/외부 메모리 시스템 내용을 제거 또는 축소(FlowHR 기준만 유지)
- 로컬 산출물(.tmp*, .pr-wi-*.md 등) 정리 기준을 `.gitignore`/문서로 명확화

### Out of Scope

- 기존 ops/anti-spoofing/anomaly/incident 기능 삭제 또는 리팩터링
- 전자결재(범용 결재선/양식) 엔진 신규 설계/구현
- Vercel 프로젝트/환경변수 UI 설정 변경(문서로 가이드만)

## User Scenarios

1. 직원/관리자 UI를 열었을 때 ops/관제 링크가 기본 노출되지 않는다.
2. 개발자는 필요 시 `NEXT_PUBLIC_FLOWHR_DEV_TOOLS=true`로 ops 도구를 확인할 수 있다.
3. Vercel Preview 빌드 환경에서 필수 env가 누락되어도(또는 일부만 설정되어도) build 단계에서 즉시 크래시하지 않는다.
4. 로드맵/실행계획 문서가 “SaaS 핵심 기능 우선”으로 읽히며, ops 기능은 부차/옵션으로 분리된다.

## Payroll Accuracy and Calculation Rules

- 해당 없음 (문서/초기화/노출 정책 작업)

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| SaaS UI에서 ops 링크 보기(`NEXT_PUBLIC_FLOWHR_DEV_TOOLS=true`) | Allow | Allow | Allow | N/A |

## Data Changes (Tables and Migrations)

- 없음

## API and Event Changes

- 없음

## Test Plan

- Unit/Integration: 기존 스위트 유지
- Regression:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npm run test:e2e` (MVP)

## Observability and Audit Logging

- 없음

## Rollback Plan

- 관련 변경은 대부분 UI 노출/초기화 로직이므로, revert 시 즉시 원복 가능
- `NEXT_PUBLIC_FLOWHR_DEV_TOOLS`는 기본값 `false` 유지

## Definition of Ready (DoR)

- [x] 요구사항이 명확하다(“SaaS 우선 + ops 숨김 + build 안전성”).
- [x] 변경 범위가 문서/초기화/노출로 제한된다.

## Definition of Done (DoD)

- [ ] 직원 UI에서 ops 링크가 기본적으로 보이지 않는다.
- [ ] `env.ts`/supabase/prisma가 lazy-init으로 변경되어 빌드 타임 크래시 위험이 낮아진다.
- [ ] `ROADMAP.md`/`docs/execution-plan.md`가 SaaS 우선순위를 반영한다.
- [ ] 린트/타입체크/빌드/회귀 테스트가 통과한다.

