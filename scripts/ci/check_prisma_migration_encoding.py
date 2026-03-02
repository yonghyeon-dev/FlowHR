#!/usr/bin/env python3
from __future__ import annotations

import argparse
import pathlib
import sys


UTF8_BOM = b"\xef\xbb\xbf"


def find_migration_sql_paths(root: pathlib.Path) -> list[pathlib.Path]:
    migrations_dir = root / "prisma" / "migrations"
    if not migrations_dir.exists():
        return []
    return sorted(path for path in migrations_dir.rglob("migration.sql") if path.is_file())


def has_utf8_bom(path: pathlib.Path) -> bool:
    with path.open("rb") as handle:
        return handle.read(3) == UTF8_BOM


def find_bom_paths(paths: list[pathlib.Path]) -> list[pathlib.Path]:
    return [path for path in paths if has_utf8_bom(path)]


def relative_to_root(path: pathlib.Path, root: pathlib.Path) -> str:
    try:
        return str(path.relative_to(root))
    except ValueError:
        return str(path)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Block UTF-8 BOM bytes in Prisma migration SQL files."
    )
    parser.add_argument(
        "--root",
        default=pathlib.Path(__file__).resolve().parents[2],
        type=pathlib.Path,
        help="Project root path containing prisma/migrations",
    )
    args = parser.parse_args(argv)

    root = args.root.resolve()
    migration_paths = find_migration_sql_paths(root)
    if not migration_paths:
        print("No Prisma migration.sql files found. Skipping.")
        return 0

    bom_paths = find_bom_paths(migration_paths)
    if bom_paths:
        print("ERROR: UTF-8 BOM is not allowed in Prisma migration.sql files:")
        for path in bom_paths:
            print(f"- {relative_to_root(path, root)}")
        return 1

    print("Prisma migration encoding checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
