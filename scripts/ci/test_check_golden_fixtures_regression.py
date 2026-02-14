#!/usr/bin/env python3
import importlib.util
import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[2]
MODULE_PATH = ROOT / "scripts" / "ci" / "check_golden_fixtures.py"


def load_module():
    spec = importlib.util.spec_from_file_location("check_golden_fixtures_module", MODULE_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError("failed to load check_golden_fixtures.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class CheckGoldenFixturesRegressionTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.module = load_module()

    def test_evaluate_change_control_skips_when_no_fixture_change(self):
        errors = self.module.evaluate_change_control(
            fixture_changes=[],
            changed_work_items=[],
            changed_contracts=[],
            changed_adrs=[],
            breaking_required=False,
        )
        self.assertEqual(errors, [])

    def test_evaluate_change_control_requires_work_item_and_contract(self):
        errors = self.module.evaluate_change_control(
            fixture_changes=[("M", "qa/golden/fixtures/GC-001-standard-day.json")],
            changed_work_items=[],
            changed_contracts=[],
            changed_adrs=[],
            breaking_required=False,
        )
        self.assertEqual(len(errors), 2)
        self.assertTrue(any("work item" in err for err in errors))
        self.assertTrue(any("contract.yaml" in err for err in errors))

    def test_evaluate_change_control_requires_adr_for_breaking(self):
        errors = self.module.evaluate_change_control(
            fixture_changes=[("D", "qa/golden/fixtures/GC-001-standard-day.json")],
            changed_work_items=["work-items/WI-0024-golden-change-control-gate.md"],
            changed_contracts=["specs/payroll/contract.yaml"],
            changed_adrs=[],
            breaking_required=True,
        )
        self.assertEqual(len(errors), 1)
        self.assertIn("requires ADR", errors[0])

    def test_evaluate_change_control_passes_with_required_links(self):
        errors = self.module.evaluate_change_control(
            fixture_changes=[("M", "qa/golden/fixtures/GC-001-standard-day.json")],
            changed_work_items=["work-items/WI-0024-golden-change-control-gate.md"],
            changed_contracts=["specs/payroll/contract.yaml"],
            changed_adrs=[],
            breaking_required=False,
        )
        self.assertEqual(errors, [])

    def test_detect_breaking_fixture_change_for_delete_and_rename(self):
        self.assertTrue(
            self.module.detect_breaking_fixture_change("base", "head", "D", "qa/golden/fixtures/GC-001.json")
        )
        self.assertTrue(
            self.module.detect_breaking_fixture_change("base", "head", "R100", "qa/golden/fixtures/GC-001.json")
        )

    def test_detect_breaking_fixture_change_for_id_change(self):
        original_git_show = self.module.git_show

        def fake_git_show(sha: str, _path: str):
            if sha == "base":
                return '{"id":"GC-001","description":"old","inputs":{},"expected":{"payable_minutes":{"regular":1,"overtime":0,"night":0,"holiday":0},"gross_pay_krw":1000,"audit_events":["a"]}}'
            if sha == "head":
                return '{"id":"GC-999","description":"new","inputs":{},"expected":{"payable_minutes":{"regular":1,"overtime":0,"night":0,"holiday":0},"gross_pay_krw":1000,"audit_events":["a"]}}'
            return None

        try:
            self.module.git_show = fake_git_show
            self.assertTrue(
                self.module.detect_breaking_fixture_change(
                    "base", "head", "M", "qa/golden/fixtures/GC-001-standard-day.json"
                )
            )
        finally:
            self.module.git_show = original_git_show

    def test_detect_breaking_fixture_change_for_non_breaking_modify(self):
        original_git_show = self.module.git_show

        def fake_git_show(_sha: str, _path: str):
            return '{"id":"GC-001","description":"same","inputs":{},"expected":{"payable_minutes":{"regular":1,"overtime":0,"night":0,"holiday":0},"gross_pay_krw":1000,"audit_events":["a"]}}'

        try:
            self.module.git_show = fake_git_show
            self.assertFalse(
                self.module.detect_breaking_fixture_change(
                    "base", "head", "M", "qa/golden/fixtures/GC-001-standard-day.json"
                )
            )
        finally:
            self.module.git_show = original_git_show


if __name__ == "__main__":
    unittest.main(verbosity=2)
