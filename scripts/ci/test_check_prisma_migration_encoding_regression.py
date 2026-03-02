#!/usr/bin/env python3
import os
import pathlib
import shutil
import subprocess
import sys
import unittest
import uuid
from contextlib import contextmanager


ROOT = pathlib.Path(__file__).resolve().parents[2]
CHECK_SCRIPT = ROOT / "scripts" / "ci" / "check_prisma_migration_encoding.py"
UTF8_BOM = b"\xef\xbb\xbf"


def run_checker(root: pathlib.Path) -> subprocess.CompletedProcess[str]:
    command = [sys.executable, str(CHECK_SCRIPT), "--root", str(root)]
    return subprocess.run(command, cwd=ROOT, text=True, capture_output=True, env=dict(os.environ))


def write_migration_sql(root: pathlib.Path, migration_id: str, content: bytes) -> pathlib.Path:
    migration_path = root / "prisma" / "migrations" / migration_id / "migration.sql"
    migration_path.parent.mkdir(parents=True, exist_ok=True)
    migration_path.write_bytes(content)
    return migration_path


class CheckPrismaMigrationEncodingRegressionTest(unittest.TestCase):
    @contextmanager
    def project_temp_dir(self):
        temp_root = ROOT / ".tmp-migration-encoding-tests" / uuid.uuid4().hex
        temp_root.mkdir(parents=True, exist_ok=True)
        try:
            yield temp_root
        finally:
            shutil.rmtree(temp_root, ignore_errors=True)

    def test_passes_when_no_bom_is_present(self):
        with self.project_temp_dir() as temp_root:
            write_migration_sql(
                temp_root,
                "202601010001_valid",
                b"-- no bom\nCREATE TABLE \"Demo\"(\"id\" TEXT NOT NULL);\n",
            )
            result = run_checker(temp_root)
            self.assertEqual(result.returncode, 0)
            self.assertIn("Prisma migration encoding checks passed.", result.stdout)

    def test_fails_when_bom_is_present(self):
        with self.project_temp_dir() as temp_root:
            write_migration_sql(
                temp_root,
                "202601010002_invalid_bom",
                UTF8_BOM + b"-- bom\nCREATE TABLE \"Demo\"(\"id\" TEXT NOT NULL);\n",
            )
            result = run_checker(temp_root)
            self.assertEqual(result.returncode, 1)
            self.assertIn("UTF-8 BOM is not allowed", result.stdout)
            self.assertIn("prisma", result.stdout)
            self.assertIn("202601010002_invalid_bom", result.stdout)

    def test_skips_when_no_migration_files_exist(self):
        with self.project_temp_dir() as temp_root:
            result = run_checker(temp_root)
            self.assertEqual(result.returncode, 0)
            self.assertIn("No Prisma migration.sql files found. Skipping.", result.stdout)


if __name__ == "__main__":
    unittest.main(verbosity=2)
