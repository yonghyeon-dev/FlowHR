# WI-1204: Admin payroll filing interactive field density follow-up

## Background

`WI-1203` compacts the narrow-width layout so the filing console preserves its denser rhythm on smaller viewports.
The next density seam is the interactive field rows where labels, inputs, and select controls still feel wider than the tightened operator console.

## Scope

1. Compact the `/admin/payroll-year-end-filing` interactive field rows so labels and controls feel more consistent across setup and follow-up stages.
2. Reduce residual control spacing without hurting readability or action clarity.
3. Update any stale regression guards that still expect the older interactive field density.

## Done When

1. Interactive field rows feel denser and more consistent across the filing console.
2. Setup and follow-up controls remain readable on both desktop and narrow widths.
3. Current quality gates remain green.
