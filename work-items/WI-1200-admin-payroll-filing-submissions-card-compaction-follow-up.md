# WI-1200: Admin payroll filing submissions card compaction follow-up

## Background

`WI-1199` compacts the setup card so the filing workspace reads like a staged operator form.
The next density seam is the submissions card. The filtered submission summary and list still read like a long record dump instead of a compact operator review panel.

## Scope

1. Compact the `/admin/payroll-year-end-filing` submissions card so summary, filtered list, and follow-up selection feel like one review panel.
2. Reduce repeated headings and long list density in the submissions card while preserving current filing tracking semantics.
3. Update any stale regression guards that still expect the older submissions-card density.

## Done When

1. The submissions card scans as a compact review panel beside the setup form.
2. Filtered submission status, ack state, and next operator action remain clear without excessive vertical sprawl.
3. Current quality gates remain green.
