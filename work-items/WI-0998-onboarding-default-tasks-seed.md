# WI-0998: Seed Default Onboarding Tasks

## Background and Problem
Employee onboarding page shows "표시할 온보딩 태스크가 없습니다". New employees see an empty onboarding checklist with 0% progress, providing no guidance.

## Scope

### In Scope
- Create default onboarding task templates that auto-assign to new employees:
  1. 개인정보 확인 및 수정
  2. 취업규칙 확인
  3. 급여계좌 등록
  4. 비상연락처 등록
  5. 부서 인사 (팀장 확인)
- Admin onboarding page should allow managing these templates
- Tasks should auto-assign when employee status becomes ACTIVE

### Out of Scope
- Custom onboarding flows per department
- Document upload for onboarding tasks
- Onboarding task due dates/reminders

## Test Plan
- [ ] New employee sees 5 default onboarding tasks
- [ ] Checking a task updates progress bar
- [ ] Admin can view employee onboarding progress
- [ ] Completing all tasks shows 100%

## Data Changes
- Migration: `202603060001_wi0998_onboarding_default_tasks_seed`
- Prisma models: `OnboardingTaskTemplate`, `OnboardingTask`
- Physical tables: onboarding_task_templates, employee_onboarding_tasks

## ADR
- Store templates in onboarding_task_templates table
- Copy templates to employee_onboarding_tasks on activation
- If no templates exist, seed defaults on first access
