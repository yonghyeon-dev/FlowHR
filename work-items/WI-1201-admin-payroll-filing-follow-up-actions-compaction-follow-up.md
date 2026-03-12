# WI-1201: Admin payroll filing follow-up actions compaction follow-up

## Background

`WI-1200` compacts the submissions review panel so filtered submission rows scan faster.
The next density seam is the follow-up action area that still spreads recovery, timeline, and evidence actions across a long control block.

## Scope

1. Compact the `/admin/payroll-year-end-filing` follow-up actions so recovery, timeline, and evidence controls read as one operator action rail.
2. Reduce repeated button stacks and preserve the current filing follow-up semantics.
3. Update any stale regression guards that still expect the older follow-up action density.

## Done When

1. Follow-up actions scan as one compact operator rail.
2. Recovery, timeline, and evidence controls remain clear without excessive vertical sprawl.
3. Current quality gates remain green.
