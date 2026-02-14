#!/usr/bin/env python3
import argparse
import os
import pathlib
import re
import sys


REQUIRED_CHECKBOXES = [
    "Work item file is linked and updated.",
    "Domain `contract.yaml` is added or updated.",
    "`test-cases.md` is added or updated.",
    "Contract version was bumped when contract changed.",
    "QA Spec Gate and Code Gate checks are completed.",
    "QA persona review completed (checklist evidence attached).",
    "Unit tests",
    "Integration tests",
    "Regression checks",
    "Lint/typecheck",
    "Migration smoke",
    "Contract governance checks",
]

ADR_CHECKBOXES = [
    "ADR added (required for breaking/cross-domain/security-impacting change), or",
    "Not required with reason.",
]

BREAK_GLASS_TRIGGER_CHECKBOXES = [
    "P0 outage",
    "Security hotfix",
    "Legal deadline",
]

BREAK_GLASS_REQUIRED_FIELDS = [
    "Incident ID",
    "Human approver",
    "Co-sign approver (Orchestrator or QA)",
    "Change scope",
    "Risk assessment",
    "Rollback plan",
    "Customer impact",
    "Temporary mitigation",
    "RCA due date (<= 48h after merge)",
]

WORK_ITEM_RE = re.compile(r"Work Item:\s*`?(work-items/WI-\d{4}[^`\n]*)`?", re.IGNORECASE)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate PR template compliance from PR body.")
    parser.add_argument(
        "--body-file",
        help="Optional file path containing PR body markdown. If omitted, reads PR_BODY env.",
    )
    return parser.parse_args()


def read_body(body_file: str | None) -> str:
    if body_file:
        return pathlib.Path(body_file).read_text(encoding="utf-8")
    return (os.environ.get("PR_BODY") or "").strip()


def checkbox_checked(body: str, label: str) -> bool:
    pattern = re.compile(rf"-\s*\[[xX]\]\s*{re.escape(label)}\s*$", re.MULTILINE)
    return bool(pattern.search(body))


def has_non_empty_field(body: str, field: str) -> bool:
    pattern = re.compile(rf"{re.escape(field)}\s*:\s*(.+)$", re.MULTILINE)
    match = pattern.search(body)
    if not match:
        return False
    value = match.group(1).strip()
    return value != ""


def main() -> int:
    args = parse_args()
    body = read_body(args.body_file)

    if not body:
        print("PR template check skipped: PR body is empty (non-PR/local execution).")
        return 0

    errors: list[str] = []

    if not WORK_ITEM_RE.search(body):
        errors.append("Summary must include Work Item path like `work-items/WI-0001-...`.")

    for label in REQUIRED_CHECKBOXES:
        if not checkbox_checked(body, label):
            errors.append(f"Unchecked required checkbox: {label}")

    if not any(checkbox_checked(body, label) for label in ADR_CHECKBOXES):
        errors.append("ADR requirement section must check either ADR added or Not required with reason.")

    break_glass_used = any(checkbox_checked(body, label) for label in BREAK_GLASS_TRIGGER_CHECKBOXES)
    if break_glass_used:
        for field in BREAK_GLASS_REQUIRED_FIELDS:
            if not has_non_empty_field(body, field):
                errors.append(f"Break-glass requires non-empty field: {field}")

    if errors:
        print("PR template compliance checks failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print("PR template compliance checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
