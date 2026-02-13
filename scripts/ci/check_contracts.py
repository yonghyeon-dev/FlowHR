#!/usr/bin/env python3
import argparse
import pathlib
import re
import subprocess
import sys
from typing import List, Optional, Tuple


REQUIRED_KEYS = [
    "owner",
    "version",
    "scope",
    "entities",
    "api",
    "db_changes",
    "invariants",
    "test_plan",
    "observability",
    "rollout",
    "rollback",
    "breaking_changes",
    "consumer_impact",
]

SEMVER_RE = re.compile(r"^[0-9]+\.[0-9]+\.[0-9]+$")
VERSION_LINE_RE = re.compile(r"(?m)^version:\s*['\"]?([0-9]+\.[0-9]+\.[0-9]+)['\"]?\s*$")
BREAKING_LINE_RE = re.compile(r"(?m)^breaking_changes:\s*(true|false)\s*$", re.IGNORECASE)
CONTRACT_FILE_RE = re.compile(r"(^|/)contract\.ya?ml$")


def git_output(args: List[str]) -> Tuple[int, str, str]:
    proc = subprocess.run(
        args,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
    )
    return proc.returncode, proc.stdout, proc.stderr


def parse_version(content: str) -> Optional[str]:
    match = VERSION_LINE_RE.search(content)
    if not match:
        return None
    return match.group(1).strip()


def parse_breaking(content: str) -> Optional[bool]:
    match = BREAKING_LINE_RE.search(content)
    if not match:
        return None
    return match.group(1).lower() == "true"


def lint_contract_file(path: pathlib.Path) -> List[str]:
    errors: List[str] = []
    try:
        content = path.read_text(encoding="utf-8")
    except Exception as exc:
        return [f"{path}: failed to read file ({exc})"]

    for key in REQUIRED_KEYS:
        if not re.search(rf"(?m)^{re.escape(key)}\s*:", content):
            errors.append(f"{path}: missing required key '{key}'")

    version = parse_version(content)
    if version is None:
        errors.append(f"{path}: missing or invalid 'version' field")
    elif not SEMVER_RE.match(version):
        errors.append(f"{path}: version '{version}' is not valid SemVer (X.Y.Z)")

    breaking = parse_breaking(content)
    if breaking is None:
        errors.append(f"{path}: missing or invalid 'breaking_changes' field (true/false)")

    return errors


def major(version: str) -> int:
    return int(version.split(".")[0])


def get_changed_contract_paths(base: str, head: str) -> List[str]:
    code, out, err = git_output(
        ["git", "diff", "--name-status", "--diff-filter=ACMR", base, head, "--", "specs"]
    )
    if code != 0:
        raise RuntimeError(f"git diff failed: {err.strip()}")

    changed: List[str] = []
    for raw in out.splitlines():
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

        candidate = candidate.replace("\\", "/")
        if CONTRACT_FILE_RE.search(candidate):
            changed.append(candidate)
    return changed


def git_show(sha: str, path: str) -> Optional[str]:
    code, out, _ = git_output(["git", "show", f"{sha}:{path}"])
    if code != 0:
        return None
    return out


def check_versioning(base: str, head: str, changed_paths: List[str]) -> List[str]:
    errors: List[str] = []

    for path in changed_paths:
        old_content = git_show(base, path)
        new_content = git_show(head, path)

        # Added file: no previous version to compare.
        if old_content is None:
            continue
        if new_content is None:
            errors.append(f"{path}: expected file at {head}, but could not read it")
            continue

        old_version = parse_version(old_content)
        new_version = parse_version(new_content)
        old_breaking = parse_breaking(old_content)
        new_breaking = parse_breaking(new_content)

        if old_version is None or new_version is None:
            errors.append(f"{path}: cannot validate version bump due to invalid version field")
            continue

        if old_version == new_version:
            errors.append(
                f"{path}: contract changed between {base[:7]} and {head[:7]} without version bump"
            )

        if (
            new_breaking is True
            and old_breaking is not None
            and major(new_version) <= major(old_version)
        ):
            errors.append(
                f"{path}: breaking_changes=true requires MAJOR bump "
                f"(old={old_version}, new={new_version})"
            )

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Lint FlowHR contract files and versioning rules.")
    parser.add_argument("--base", help="Base git SHA for versioning check")
    parser.add_argument("--head", help="Head git SHA for versioning check")
    args = parser.parse_args()

    errors: List[str] = []

    contract_paths = sorted(pathlib.Path("specs").rglob("contract.yaml"))
    if not contract_paths:
        print("No contract.yaml files found under specs/.")
    else:
        for path in contract_paths:
            errors.extend(lint_contract_file(path))

    if args.base and args.head:
        try:
            changed_paths = get_changed_contract_paths(args.base, args.head)
        except RuntimeError as exc:
            errors.append(str(exc))
            changed_paths = []

        if changed_paths:
            errors.extend(check_versioning(args.base, args.head, changed_paths))
        else:
            print("No changed contract.yaml files between provided SHAs.")
    else:
        print("Versioning diff check skipped (base/head not provided).")

    if errors:
        print("Contract governance checks failed:")
        for err in errors:
            print(f"- {err}")
        return 1

    print("Contract governance checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
