#!/usr/bin/env python3
import pathlib
import re
import shutil
import subprocess
import sys
import unittest
import uuid
import os
from contextlib import contextmanager


ROOT = pathlib.Path(__file__).resolve().parents[2]
CHECK_SCRIPT = ROOT / "scripts" / "ci" / "check_pr_template.py"


VALID_PR_BODY = """## Summary

- Work Item: `work-items/WI-0021-pr-template-compliance-gate.md`
- Related Specs: docs/execution-plan.md
- Related ADR: not required

## Required Checklist

- [x] Work item file is linked and updated.
- [x] Domain `contract.yaml` is added or updated.
- [x] `test-cases.md` is added or updated.
- [x] Contract version was bumped when contract changed.
- [x] ADR requirement reviewed:
  - [ ] ADR added (required for breaking/cross-domain/security-impacting change), or
  - [x] Not required with reason.
- [x] QA Spec Gate and Code Gate checks are completed.
- [x] QA persona review completed (checklist evidence attached).

## Quality Gate Evidence

- [x] Unit tests
- [x] Integration tests
- [x] Regression checks
- [x] Lint/typecheck
- [x] Migration smoke
- [x] Contract governance checks

## Emergency Override (Break-Glass Only)

Complete this section only when bypassing normal QA gate.

- [ ] Break-glass trigger category:
  - [ ] P0 outage
  - [ ] Security hotfix
  - [ ] Legal deadline
- Incident ID:
- Approval:
  - Human approver:
  - Co-sign approver (Orchestrator or QA):
- Change scope:
- Risk assessment:
- Rollback plan:
- Customer impact:
- Temporary mitigation:
- RCA due date (<= 48h after merge):
"""


def run_checker(body: str | None = None, body_file: pathlib.Path | None = None) -> subprocess.CompletedProcess[str]:
    command = [sys.executable, str(CHECK_SCRIPT)]
    env = dict(os.environ)
    if body is not None:
        env["PR_BODY"] = body
    else:
        env.pop("PR_BODY", None)

    if body_file is not None:
        command.extend(["--body-file", str(body_file)])

    return subprocess.run(command, cwd=ROOT, text=True, capture_output=True, env=env)


def fill_break_glass_fields(body: str) -> str:
    values = {
        "Incident ID": "INC-2026-0001",
        "Human approver": "human-owner",
        "Co-sign approver (Orchestrator or QA)": "qa-owner",
        "Change scope": "workflow alert payload metadata",
        "Risk assessment": "low",
        "Rollback plan": "revert notifier/env fields",
        "Customer impact": "none",
        "Temporary mitigation": "manual runbook notification",
        "RCA due date (<= 48h after merge)": "2026-02-16",
    }
    result = body
    for key, value in values.items():
        pattern = re.compile(
            rf"(^[^\S\r\n]*-?[^\S\r\n]*{re.escape(key)}:[ \t]*)([^\r\n]*)$",
            re.MULTILINE,
        )
        result, count = pattern.subn(rf"\g<1>{value}", result, count=1)
        if count != 1:
            raise AssertionError(f"failed to fill break-glass field: {key}")
    return result


class CheckPrTemplateRegressionTest(unittest.TestCase):
    @contextmanager
    def project_temp_dir(self):
        temp_root = ROOT / ".tmp-pr-template-tests" / uuid.uuid4().hex
        temp_root.mkdir(parents=True, exist_ok=True)
        try:
            yield temp_root
        finally:
            shutil.rmtree(temp_root, ignore_errors=True)

    def test_empty_body_is_skipped(self):
        result = run_checker(body=None, body_file=None)
        self.assertEqual(result.returncode, 0)
        self.assertIn("PR template check skipped", result.stdout)

    def test_valid_body_passes(self):
        with self.project_temp_dir() as temp_root:
            body_file = temp_root / "valid.md"
            body_file.write_text(VALID_PR_BODY, encoding="utf-8")
            result = run_checker(body_file=body_file)
            self.assertEqual(result.returncode, 0)
            self.assertIn("PR template compliance checks passed.", result.stdout)

    def test_missing_work_item_fails(self):
        invalid_body = VALID_PR_BODY.replace("work-items/WI-0021-pr-template-compliance-gate.md", "WI-missing")
        result = run_checker(body=invalid_body)
        self.assertEqual(result.returncode, 1)
        self.assertIn("Summary must include Work Item path", result.stdout)

    def test_unchecked_required_checkbox_fails(self):
        invalid_body = VALID_PR_BODY.replace(
            "- [x] QA Spec Gate and Code Gate checks are completed.",
            "- [ ] QA Spec Gate and Code Gate checks are completed.",
        )
        result = run_checker(body=invalid_body)
        self.assertEqual(result.returncode, 1)
        self.assertIn("Unchecked required checkbox", result.stdout)

    def test_break_glass_requires_non_empty_fields(self):
        invalid_body = VALID_PR_BODY.replace("- [ ] P0 outage", "- [x] P0 outage")
        result = run_checker(body=invalid_body)
        self.assertEqual(result.returncode, 1)
        self.assertIn("Break-glass requires non-empty field", result.stdout)

    def test_break_glass_with_required_fields_passes(self):
        body = VALID_PR_BODY.replace("- [ ] P0 outage", "- [x] P0 outage")
        body = fill_break_glass_fields(body)
        result = run_checker(body=body)
        self.assertEqual(result.returncode, 0)
        self.assertIn("PR template compliance checks passed.", result.stdout)


if __name__ == "__main__":
    unittest.main(verbosity=2)
