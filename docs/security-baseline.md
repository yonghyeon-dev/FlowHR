# Security Baseline (HRM)

## Scope

This baseline applies to attendance, approval, and payroll flows.

## Data Classification

| Class | Examples | Controls |
| --- | --- | --- |
| Public | Product docs, non-sensitive metadata | Integrity checks, standard access |
| Internal | Org structure, non-sensitive schedules | AuthN, role-based read controls |
| Confidential (PII) | Name, email, phone, employee ID | Encryption at rest and in transit, masked logs |
| Restricted | Resident ID, account number, salary details | Strict least privilege, audit, limited export |

## PII Handling

- Collect only required fields.
- Use masking in logs and analytics outputs.
- Do not expose full account/identifier values in UI or logs.

## Retention Baseline

- Business audit logs: 5 years default.
- Security access logs: 2 years default.
- Contract and payroll retention must meet local legal policy.

## Audit Log Integrity

- Append-only write model for audit events.
- Immutable event IDs and event timestamps.
- Write and read permission separation.
- Integrity verification by periodic hash/checksum.

## Access Control Minimums

- Role-based access control for all HRM resources.
- Privileged actions require explicit role checks.
- Access-denied attempts must be auditable.

## Secrets and Encryption

- Secrets from managed store, never in source files.
- TLS in transit.
- Encrypted storage for restricted data.

## Change Control

- Security-impacting changes require ADR reference.
- Break-glass merges must include security risk notes and 48h RCA.
