# WI-1206: Admin payroll filing side rail mobile follow-up

## Background

`WI-1205` compacts the filing side rail cards so settlement, blocker, and recovery context better match the denser operator console.
The next seam is the narrow-width side rail flow where those supporting cards still need tighter stacking and mobile-specific spacing.

## Scope

1. Compact the `/admin/payroll-year-end-filing` side rail for narrow widths so summary, blocker, and recovery cards stack cleanly on smaller screens.
2. Tighten mobile-only spacing and action wrapping without hurting readability.
3. Update any stale regression guards that still expect the older side rail mobile density.

## Done When

1. Side rail cards stay readable and compact on narrow widths.
2. Action groups and support cards keep a stable stack on mobile.
3. Current quality gates remain green.
