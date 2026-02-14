#!/usr/bin/env python3
import argparse
import json
import pathlib
import re
import subprocess
import sys
from typing import List, Optional, Tuple


REQUIRED_ROOT_KEYS = ["id", "description", "inputs", "expected"]
REQUIRED_EXPECTED_KEYS = ["payable_minutes", "gross_pay_krw", "audit_events"]
REQUIRED_MINUTE_BUCKETS = ["regular", "overtime", "night", "holiday"]
PHASE2_KEYS = [
    "mode",
    "withholdingTaxKrw",
    "socialInsuranceKrw",
    "otherDeductionsKrw",
    "totalDeductionsKrw",
    "netPayKrw",
]

WORK_ITEM_FILE_RE = re.compile(r"(^|/)work-items/WI-\d{4}.*\.md$")
CONTRACT_FILE_RE = re.compile(r"(^|/)specs/.+/contract\.yaml$")
ADR_FILE_RE = re.compile(r"(^|/)adr/ADR-\d{4}.*\.md$")


def git_output(args: List[str]) -> Tuple[int, str, str]:
    proc = subprocess.run(
        args,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
    )
    return proc.returncode, proc.stdout, proc.stderr


def normalize_path(path: str) -> str:
    return path.replace("\\", "/")


def parse_changed_entries(diff_output: str) -> List[Tuple[str, str]]:
    entries: List[Tuple[str, str]] = []
    for raw in diff_output.splitlines():
        if not raw.strip():
            continue
        parts = raw.split("\t")
        status = parts[0]
        if status.startswith("R") and len(parts) >= 3:
            candidate = parts[2]
        elif len(parts) >= 2:
            candidate = parts[1]
        else:
            continue
        entries.append((status, normalize_path(candidate)))
    return entries


def get_changed_entries(base: str, head: str, pathspecs: List[str]) -> List[Tuple[str, str]]:
    code, out, err = git_output(
        ["git", "diff", "--name-status", "--diff-filter=ACMRD", base, head, "--", *pathspecs]
    )
    if code != 0:
        raise RuntimeError(f"git diff failed: {err.strip()}")
    return parse_changed_entries(out)


def git_show(sha: str, path: str) -> Optional[str]:
    code, out, _ = git_output(["git", "show", f"{sha}:{path}"])
    if code != 0:
        return None
    return out


def parse_fixture_id(content: str, label: str) -> Optional[str]:
    try:
        payload = json.loads(content)
    except Exception as exc:
        raise ValueError(f"{label}: invalid JSON ({exc})") from exc
    fixture_id = payload.get("id")
    if not isinstance(fixture_id, str) or not fixture_id.strip():
        raise ValueError(f"{label}: fixture id must be a non-empty string")
    return fixture_id


def detect_breaking_fixture_change(base: str, head: str, status: str, path: str) -> bool:
    if status.startswith("D") or status.startswith("R"):
        return True
    if not status.startswith("M"):
        return False

    old_content = git_show(base, path)
    new_content = git_show(head, path)
    if old_content is None or new_content is None:
        return False

    old_id = parse_fixture_id(old_content, f"{base[:7]}:{path}")
    new_id = parse_fixture_id(new_content, f"{head[:7]}:{path}")
    return old_id != new_id


def evaluate_change_control(
    fixture_changes: List[Tuple[str, str]],
    changed_work_items: List[str],
    changed_contracts: List[str],
    changed_adrs: List[str],
    breaking_required: bool,
) -> List[str]:
    errors: List[str] = []
    if not fixture_changes:
        return errors

    if not changed_work_items:
        errors.append(
            "Golden fixtures changed without any linked work item update under work-items/WI-*.md."
        )
    if not changed_contracts:
        errors.append("Golden fixtures changed without any contract.yaml update under specs/*/contract.yaml.")
    if breaking_required and not changed_adrs:
        errors.append("Breaking golden fixture change requires ADR update under adr/ADR-*.md.")

    return errors


def enforce_change_control(base: str, head: str) -> List[str]:
    errors: List[str] = []

    fixture_changes = [
        entry
        for entry in get_changed_entries(base, head, ["qa/golden/fixtures"])
        if entry[1].endswith(".json")
    ]
    if not fixture_changes:
        return errors

    changed_work_items = [
        path
        for _status, path in get_changed_entries(base, head, ["work-items"])
        if WORK_ITEM_FILE_RE.search(path)
    ]
    changed_contracts = [
        path
        for _status, path in get_changed_entries(base, head, ["specs"])
        if CONTRACT_FILE_RE.search(path)
    ]
    changed_adrs = [
        path
        for _status, path in get_changed_entries(base, head, ["adr"])
        if ADR_FILE_RE.search(path)
    ]

    breaking_required = False
    for status, path in fixture_changes:
        try:
            if detect_breaking_fixture_change(base, head, status, path):
                breaking_required = True
        except ValueError as exc:
            errors.append(str(exc))

    errors.extend(
        evaluate_change_control(
            fixture_changes=fixture_changes,
            changed_work_items=changed_work_items,
            changed_contracts=changed_contracts,
            changed_adrs=changed_adrs,
            breaking_required=breaking_required,
        )
    )

    return errors


def validate_fixture(path: pathlib.Path, seen_ids: set) -> List[str]:
    errors: List[str] = []
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        return [f"{path}: invalid JSON ({exc})"]

    for key in REQUIRED_ROOT_KEYS:
        if key not in payload:
            errors.append(f"{path}: missing root key '{key}'")

    fixture_id = payload.get("id")
    if isinstance(fixture_id, str):
        if fixture_id in seen_ids:
            errors.append(f"{path}: duplicate fixture id '{fixture_id}'")
        else:
            seen_ids.add(fixture_id)
    else:
        errors.append(f"{path}: 'id' must be a string")

    expected = payload.get("expected")
    if not isinstance(expected, dict):
        errors.append(f"{path}: 'expected' must be an object")
        return errors

    for key in REQUIRED_EXPECTED_KEYS:
        if key not in expected:
            errors.append(f"{path}: expected missing key '{key}'")

    payable = expected.get("payable_minutes")
    if isinstance(payable, dict):
        for bucket in REQUIRED_MINUTE_BUCKETS:
            if bucket not in payable:
                errors.append(f"{path}: payable_minutes missing '{bucket}'")
            elif not isinstance(payable[bucket], int) or payable[bucket] < 0:
                errors.append(f"{path}: payable_minutes.{bucket} must be non-negative integer")
    else:
        errors.append(f"{path}: expected.payable_minutes must be an object")

    gross_pay = expected.get("gross_pay_krw")
    if not isinstance(gross_pay, int) or gross_pay < 0:
        errors.append(f"{path}: expected.gross_pay_krw must be non-negative integer")

    audit_events = expected.get("audit_events")
    if not isinstance(audit_events, list) or not audit_events:
        errors.append(f"{path}: expected.audit_events must be a non-empty array")
    else:
        for idx, event in enumerate(audit_events):
            if not isinstance(event, str) or not event.strip():
                errors.append(f"{path}: expected.audit_events[{idx}] must be non-empty string")

    phase2 = expected.get("phase2")
    if phase2 is not None:
        if not isinstance(phase2, dict):
            errors.append(f"{path}: expected.phase2 must be an object when provided")
        else:
            for key in PHASE2_KEYS:
                if key not in phase2:
                    errors.append(f"{path}: expected.phase2 missing key '{key}'")

            mode = phase2.get("mode")
            if mode not in ("manual", "profile"):
                errors.append(f"{path}: expected.phase2.mode must be 'manual' or 'profile'")

            for key in PHASE2_KEYS:
                if key == "mode":
                    continue
                value = phase2.get(key)
                if not isinstance(value, int) or value < 0:
                    errors.append(f"{path}: expected.phase2.{key} must be non-negative integer")

    return errors


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate golden fixture schema and change-control policy.")
    parser.add_argument("--base", help="Base git SHA for change-control checks")
    parser.add_argument("--head", help="Head git SHA for change-control checks")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    root = pathlib.Path("qa/golden/fixtures")
    if not root.exists():
        print("qa/golden/fixtures does not exist")
        return 1

    fixture_files = sorted(root.glob("*.json"))
    if not fixture_files:
        print("No golden fixtures found under qa/golden/fixtures")
        return 1

    errors: List[str] = []
    seen_ids = set()
    for path in fixture_files:
        errors.extend(validate_fixture(path, seen_ids))

    if args.base and args.head:
        try:
            errors.extend(enforce_change_control(args.base, args.head))
        except RuntimeError as exc:
            errors.append(str(exc))
    else:
        print("Golden change-control check skipped (base/head not provided).")

    if errors:
        print("Golden fixture validation failed:")
        for err in errors:
            print(f"- {err}")
        return 1

    print(f"Golden fixture validation passed ({len(fixture_files)} fixtures).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
