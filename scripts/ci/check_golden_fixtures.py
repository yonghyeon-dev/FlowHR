#!/usr/bin/env python3
import json
import pathlib
import sys
from typing import Dict, List


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
    if not isinstance(expected, Dict):
        errors.append(f"{path}: 'expected' must be an object")
        return errors

    for key in REQUIRED_EXPECTED_KEYS:
        if key not in expected:
            errors.append(f"{path}: expected missing key '{key}'")

    payable = expected.get("payable_minutes")
    if isinstance(payable, Dict):
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
        if not isinstance(phase2, Dict):
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


def main() -> int:
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

    if errors:
        print("Golden fixture validation failed:")
        for err in errors:
            print(f"- {err}")
        return 1

    print(f"Golden fixture validation passed ({len(fixture_files)} fixtures).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
