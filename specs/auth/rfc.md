# Auth Invite RFC (Baseline)

## Goal

- 관리자가 직원에게 전달할 **초대 링크(action_link)** 를 생성하고,
- Supabase Auth의 `app_metadata`에 `role`, `organization_id`, `actor_id(선택)`를 세팅해
  FlowHR가 **Bearer 세션만으로** SaaS처럼 동작하도록 합니다.

## Key Decisions

- 초대 링크는 Supabase Admin API `generateLink(type=invite)`로 생성합니다. (메일 발송은 이후 단계)
- 권한/조직 정보는 **user_metadata가 아니라 app_metadata**를 SSoT로 합니다.
- `actor_id`를 쓰면 Supabase user uuid와 도메인 Actor(예: `Employee.id`)를 분리할 수 있습니다.

## Risks

- action_link는 계정 접근을 제공할 수 있으므로 **admin/system 전용**으로만 반환되어야 합니다.
- redirect URL은 Supabase Auth 설정의 allowlist에 포함되어야 정상 동작합니다.

