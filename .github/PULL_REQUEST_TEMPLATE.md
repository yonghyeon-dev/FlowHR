## Summary

- Work Item: `work-items/WI-XXXX.md`
- Related Specs:
- Related ADR:

## Required Checklist

- [ ] Work item file is linked and updated.
- [ ] Domain `contract.yaml` is added or updated.
- [ ] `test-cases.md` is added or updated.
- [ ] Contract version was bumped when contract changed.
- [ ] ADR requirement reviewed:
  - [ ] ADR added (required for breaking/cross-domain/security-impacting change), or
  - [ ] Not required with reason.
- [ ] QA Spec Gate and Code Gate checks are completed.
- [ ] No merge before QA approval.

## Quality Gate Evidence

- [ ] Unit tests
- [ ] Integration tests
- [ ] Regression checks
- [ ] Lint/typecheck
- [ ] Migration smoke
- [ ] Contract governance checks

## Emergency Override (Break-Glass Only)

Complete this section only when bypassing normal QA gate.

- [ ] Break-glass trigger category:
  - [ ] P0 outage
  - [ ] Security hotfix
  - [ ] Legal deadline
- Incident ID:
- Approval:
  - Human approver:
  - Co-sign approver (Orchestrator or QA):
- Change scope:
- Risk assessment:
- Rollback plan:
- Customer impact:
- Temporary mitigation:
- RCA due date (<= 48h after merge):
