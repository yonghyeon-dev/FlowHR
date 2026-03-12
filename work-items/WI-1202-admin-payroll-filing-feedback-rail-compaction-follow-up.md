# WI-1202: Admin payroll filing feedback rail compaction follow-up

## Background

`WI-1201` compacts the follow-up action rail so operator controls scan faster.
The next density seam is the feedback rail where pending, success, and error states still consume more space than the tightened filing console.

## Scope

1. Compact the `/admin/payroll-year-end-filing` feedback rail so pending, success, and error states feel like one concise status strip.
2. Reduce repeated vertical space around filing feedback while preserving the current status semantics.
3. Update any stale regression guards that still expect the older feedback-rail density.

## Done When

1. The feedback rail reads as one compact operator status strip.
2. Pending, success, and error states remain clear without dominating the console.
3. Current quality gates remain green.
