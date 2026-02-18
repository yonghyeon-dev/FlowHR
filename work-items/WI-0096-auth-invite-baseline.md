# WI-0096: 초대/가입(Auth Invite) Baseline

## Background and Problem

FlowHR는 Supabase Auth 세션(Bearer) 기반으로 API를 호출하지만, 현재는 사용자가 직접 Supabase 콘솔에서 계정을 만들고
`app_metadata(role/organization_id/actor_id)`를 수동으로 세팅해야만 SaaS처럼 사용할 수 있습니다.

즉, "관리자가 직원을 초대하고, 직원이 링크로 가입/로그인해서 바로 포털을 사용"하는 기본 SaaS 여정이 비어 있습니다.

## Scope

### In Scope

- 관리자(`/admin`)에서 초대 생성 UI 제공
  - 초대할 이메일
  - 역할(role): `employee | manager | payroll_operator | admin`
  - Organization ID (현재 컨텍스트 사용)
  - Actor ID(선택): 도메인 Actor ID(예: `Employee.id`)로 매핑할 수 있도록 `app_metadata.actor_id` 설정
- 서버 API: `POST /api/auth/invites`
  - Supabase Admin API `generateLink(type=invite)`로 초대 링크(action_link) 생성
  - 생성된 유저에 `app_metadata.role`, `app_metadata.organization_id`, `app_metadata.actor_id(선택)`를 **기존 app_metadata에 merge**하여 업데이트
  - 결과로 초대 링크를 반환(메일 발송은 Phase2)

### Out of Scope

- 이메일 발송/템플릿(메일링 인프라)
- 회원가입(Sign-up) 자체를 FlowHR에서 직접 제공
- 초대 만료/재발급 정책 고도화

## Test Plan

- `npm run lint`
- `npm run typecheck`
- `npm test`
- (CI) `npm run test:integration`
- (CI) `npm run test:e2e:mvp`

