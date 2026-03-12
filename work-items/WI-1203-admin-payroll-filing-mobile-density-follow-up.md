# WI-1203: Admin payroll filing mobile density follow-up

## Background

`WI-1202` compacts the filing feedback rail so status states consume less vertical space on the main console.
The next density seam is the mobile and narrow-width layout where the filing console still keeps desktop-first spacing in a few stacked regions.

## Scope

1. Compact the `/admin/payroll-year-end-filing` narrow-width layout so setup, submissions, action rail, and feedback strip stack cleanly on smaller viewports.
2. Reduce residual desktop-first spacing that still appears after the filing compaction wave.
3. Update any stale regression guards that still expect the older narrow-width density.

## Done When

1. Filing console sections stack with compact spacing on narrow widths.
2. Setup, review, action, and feedback regions remain readable without excessive whitespace.
3. Current quality gates remain green.
