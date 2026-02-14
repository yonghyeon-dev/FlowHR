#!/usr/bin/env python3
import importlib.util
import pathlib
import re
import unittest
import uuid
import shutil
from contextlib import contextmanager


ROOT = pathlib.Path(__file__).resolve().parents[2]
MODULE_PATH = ROOT / "scripts" / "ci" / "check_contracts.py"


def load_check_contracts_module():
    spec = importlib.util.spec_from_file_location("check_contracts_module", MODULE_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError("failed to load check_contracts.py module")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def bump_patch(version: str) -> str:
    major, minor, patch = version.split(".")
    return f"{major}.{minor}.{int(patch) + 1}"


class CheckContractsRegressionTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.module = load_check_contracts_module()
        cls.validator = cls.module.load_schema(ROOT / "contracts" / "contract.schema.json")
        cls.contract_text = (ROOT / "specs" / "attendance" / "contract.yaml").read_text(encoding="utf-8")
        cls.api_text = (ROOT / "specs" / "attendance" / "api.yaml").read_text(encoding="utf-8")

        match = re.search(r"(?m)^version:\s*([0-9]+\.[0-9]+\.[0-9]+)\s*$", cls.contract_text)
        if not match:
            raise RuntimeError("failed to parse attendance contract version")
        cls.contract_version = match.group(1)

    def write_contract_and_api(
        self, temp_root: pathlib.Path, contract_text: str, api_text: str | None
    ) -> pathlib.Path:
        domain_dir = temp_root / "specs" / "attendance"
        domain_dir.mkdir(parents=True, exist_ok=True)

        contract_path = domain_dir / "contract.yaml"
        contract_path.write_text(contract_text, encoding="utf-8")

        if api_text is not None:
            (domain_dir / "api.yaml").write_text(api_text, encoding="utf-8")

        return contract_path

    @contextmanager
    def project_temp_dir(self):
        temp_root = ROOT / ".tmp-contract-governance-tests" / uuid.uuid4().hex
        temp_root.mkdir(parents=True, exist_ok=True)
        try:
            yield str(temp_root)
        finally:
            shutil.rmtree(temp_root, ignore_errors=True)

    def test_lint_contract_file_requires_sibling_api(self):
        with self.project_temp_dir() as temp_dir:
            contract_path = self.write_contract_and_api(
                pathlib.Path(temp_dir), self.contract_text, api_text=None
            )
            errors = self.module.lint_contract_file(contract_path, self.validator)
            self.assertTrue(any("missing sibling api.yaml file" in err for err in errors))

    def test_lint_contract_file_detects_contract_api_version_mismatch(self):
        mismatched_api_text = re.sub(
            r"(?m)^(\s*version:\s*)([0-9]+\.[0-9]+\.[0-9]+)\s*$",
            rf"\g<1>{bump_patch(self.contract_version)}",
            self.api_text,
            count=1,
        )

        with self.project_temp_dir() as temp_dir:
            contract_path = self.write_contract_and_api(
                pathlib.Path(temp_dir), self.contract_text, api_text=mismatched_api_text
            )
            errors = self.module.lint_contract_file(contract_path, self.validator)
            self.assertTrue(any("version mismatch with" in err for err in errors))

    def test_check_api_contract_coupling_blocks_api_only_change(self):
        original_git_show = self.module.git_show

        def fake_git_show(sha: str, path: str):
            if path != "specs/attendance/api.yaml":
                return None
            if sha == "base":
                return "old"
            if sha == "head":
                return "new"
            return None

        try:
            self.module.git_show = fake_git_show
            errors = self.module.check_api_contract_coupling(
                "base", "head", [], ["specs/attendance/api.yaml"]
            )
            self.assertEqual(len(errors), 1)
            self.assertIn("without sibling contract.yaml change/version bump", errors[0])
        finally:
            self.module.git_show = original_git_show

    def test_check_api_contract_coupling_allows_api_change_with_contract_change(self):
        original_git_show = self.module.git_show

        def fake_git_show(_sha: str, _path: str):
            return "changed"

        try:
            self.module.git_show = fake_git_show
            errors = self.module.check_api_contract_coupling(
                "base",
                "head",
                ["specs/attendance/contract.yaml"],
                ["specs/attendance/api.yaml"],
            )
            self.assertEqual(errors, [])
        finally:
            self.module.git_show = original_git_show

    def test_check_versioning_requires_bump(self):
        original_git_show = self.module.git_show
        old_contract = "version: 1.2.1\nbreaking_changes: false\n"
        new_contract = "version: 1.2.1\nbreaking_changes: false\n"

        def fake_git_show(sha: str, _path: str):
            if sha == "base":
                return old_contract
            if sha == "head":
                return new_contract
            return None

        try:
            self.module.git_show = fake_git_show
            errors = self.module.check_versioning("base", "head", ["specs/attendance/contract.yaml"])
            self.assertTrue(any("without version bump" in err for err in errors))
        finally:
            self.module.git_show = original_git_show

    def test_check_versioning_requires_major_when_breaking(self):
        original_git_show = self.module.git_show
        old_contract = "version: 1.2.1\nbreaking_changes: false\n"
        new_contract = "version: 1.2.2\nbreaking_changes: true\n"

        def fake_git_show(sha: str, _path: str):
            if sha == "base":
                return old_contract
            if sha == "head":
                return new_contract
            return None

        try:
            self.module.git_show = fake_git_show
            errors = self.module.check_versioning("base", "head", ["specs/attendance/contract.yaml"])
            self.assertTrue(any("breaking_changes=true requires MAJOR bump" in err for err in errors))
        finally:
            self.module.git_show = original_git_show


if __name__ == "__main__":
    unittest.main(verbosity=2)
