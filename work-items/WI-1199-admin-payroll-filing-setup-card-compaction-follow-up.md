# WI-1199: Admin payroll filing setup card compaction follow-up

## Background

`WI-1198` compacts the blocker card so priority failures and warnings scan faster beside the filing workspace.
The next density seam is the setup card itself. The filing setup card still carries long input stretches and action stacks that can be tightened into a clearer staged operator form.

## Scope

1. Compact the `/admin/payroll-year-end-filing` setup card so baseline inputs, submission setup, and follow-up actions feel like one staged operator form.
2. Reduce repeated headings and spacing in the setup card while preserving the current staged semantics from `WI-1193`.
3. Update any stale regression guards that still expect the older setup-card density.

## Done When

1. The filing setup card reads as one staged operator form with less dead space.
2. Baseline inputs, setup controls, and follow-up actions remain clear without overwhelming the main workspace.
3. Current quality gates remain green.
