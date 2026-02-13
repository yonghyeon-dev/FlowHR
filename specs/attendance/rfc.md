# Attendance RFC (WI-0001)

## Goal

Deliver attendance contract and API behavior needed for the first vertical slice.

## Key Decisions

- Contract-first schema and approval/rejection flow.
- Event publication after approval/rejection to feed payroll aggregation.
- Time normalization delegated to common SSoT rules.

## Non-Goals

- Device integration protocols.
- Multi-country attendance policy variants.
