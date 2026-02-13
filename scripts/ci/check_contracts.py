#!/usr/bin/env python3
import argparse
import json
import pathlib
import re
import subprocess
import sys
from typing import Any, Dict, List, Optional, Tuple

try:
    import yaml  # type: ignore
    from jsonschema import Draft202012Validator  # type: ignore
except Exception:
    print(
        "Missing Python dependencies for contract checks. "
        "Install with: pip install -r scripts/ci/requirements.txt"
    )
    sys.exit(2)


SEMVER_RE = re.compile(r"^[0-9]+\.[0-9]+\.[0-9]+$")
CONTRACT_FILE_RE = re.compile(r"(^|/)contract\.ya?ml$")
API_FILE_RE = re.compile(r"(^|/)api\.ya?ml$")
SCHEMA_PATH = pathlib.Path("contracts/contract.schema.json")


def git_output(args: List[str]) -> Tuple[int, str, str]:
    proc = subprocess.run(
        args,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
    )
    return proc.returncode, proc.stdout, proc.stderr


def major(version: str) -> int:
    return int(version.split(".")[0])


def read_text(path: pathlib.Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except Exception as exc:
        raise ValueError(f"{path}: failed to read file ({exc})") from exc


def load_yaml(content: str, label: str) -> Dict[str, Any]:
    try:
        parsed = yaml.safe_load(content)
    except Exception as exc:
        raise ValueError(f"{label}: invalid YAML ({exc})") from exc
    if not isinstance(parsed, dict):
        raise ValueError(f"{label}: root YAML node must be an object")
    return parsed


def load_schema(path: pathlib.Path) -> Draft202012Validator:
    if not path.exists():
        raise ValueError(f"{path}: schema file not found")

    try:
        schema = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        raise ValueError(f"{path}: invalid JSON schema ({exc})") from exc

    try:
        return Draft202012Validator(schema)
    except Exception as exc:
        raise ValueError(f"{path}: invalid schema definition ({exc})") from exc


def format_schema_error(file_label: str, error: Any) -> str:
    if list(error.path):
        pointer = ".".join(str(part) for part in error.path)
        return f"{file_label}: schema violation at '{pointer}': {error.message}"
    return f"{file_label}: schema violation: {error.message}"


def lint_contract_file(path: pathlib.Path, validator: Draft202012Validator) -> List[str]:
    errors: List[str] = []

    try:
        content = read_text(path)
        data = load_yaml(content, str(path))
    except ValueError as exc:
        return [str(exc)]

    schema_errors = sorted(validator.iter_errors(data), key=lambda item: list(item.path))
    for err in schema_errors:
        errors.append(format_schema_error(str(path), err))

    version = data.get("version")
    if not isinstance(version, str) or not SEMVER_RE.match(version):
        errors.append(f"{path}: version must match SemVer (X.Y.Z)")

    if not isinstance(data.get("breaking_changes"), bool):
        errors.append(f"{path}: breaking_changes must be boolean")

    api_path = path.parent / "api.yaml"
    if not api_path.exists():
        errors.append(f"{path}: missing sibling api.yaml file")
    else:
        try:
            api_content = read_text(api_path)
            api_data = load_yaml(api_content, str(api_path))
        except ValueError as exc:
            errors.append(str(exc))
        else:
            info = api_data.get("info")
            if not isinstance(info, dict):
                errors.append(f"{api_path}: missing 'info' object")
            else:
                api_version = info.get("version")
                if not isinstance(api_version, str) or not SEMVER_RE.match(api_version):
                    errors.append(f"{api_path}: info.version must match SemVer (X.Y.Z)")
                elif isinstance(version, str) and SEMVER_RE.match(version) and api_version != version:
                    errors.append(
                        f"{path}: version mismatch with {api_path} "
                        f"(contract={version}, api={api_version})"
                    )

    return errors


def get_changed_spec_paths(base: str, head: str) -> List[str]:
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

        changed.append(candidate.replace("\\", "/"))
    return changed


def get_changed_contract_paths(base: str, head: str) -> List[str]:
    return [path for path in get_changed_spec_paths(base, head) if CONTRACT_FILE_RE.search(path)]


def get_changed_api_paths(base: str, head: str) -> List[str]:
    return [path for path in get_changed_spec_paths(base, head) if API_FILE_RE.search(path)]


def git_show(sha: str, path: str) -> Optional[str]:
    code, out, _ = git_output(["git", "show", f"{sha}:{path}"])
    if code != 0:
        return None
    return out


def parse_version_and_breaking(content: str, label: str) -> Tuple[str, bool]:
    data = load_yaml(content, label)
    version = data.get("version")
    breaking = data.get("breaking_changes")

    if not isinstance(version, str) or not SEMVER_RE.match(version):
        raise ValueError(f"{label}: invalid version (must be X.Y.Z)")
    if not isinstance(breaking, bool):
        raise ValueError(f"{label}: breaking_changes must be boolean")

    return version, breaking


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

        try:
            old_version, _old_breaking = parse_version_and_breaking(old_content, f"{base[:7]}:{path}")
            new_version, new_breaking = parse_version_and_breaking(new_content, f"{head[:7]}:{path}")
        except ValueError as exc:
            errors.append(str(exc))
            continue

        if old_version == new_version:
            errors.append(
                f"{path}: contract changed between {base[:7]} and {head[:7]} without version bump"
            )

        if new_breaking and major(new_version) <= major(old_version):
            errors.append(
                f"{path}: breaking_changes=true requires MAJOR bump "
                f"(old={old_version}, new={new_version})"
            )

    return errors


def check_api_contract_coupling(
    base: str, head: str, changed_contract_paths: List[str], changed_api_paths: List[str]
) -> List[str]:
    errors: List[str] = []
    changed_contract_set = set(changed_contract_paths)

    for api_path in changed_api_paths:
        contract_path = f"{pathlib.PurePosixPath(api_path).parent.as_posix()}/contract.yaml"
        if contract_path in changed_contract_set:
            continue

        old_api = git_show(base, api_path)
        new_api = git_show(head, api_path)

        if old_api == new_api:
            continue

        errors.append(
            f"{api_path}: api.yaml changed between {base[:7]} and {head[:7]} "
            f"without sibling contract.yaml change/version bump"
        )

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Lint FlowHR contract files (YAML+schema) and versioning rules."
    )
    parser.add_argument("--base", help="Base git SHA for versioning check")
    parser.add_argument("--head", help="Head git SHA for versioning check")
    args = parser.parse_args()

    errors: List[str] = []

    try:
        validator = load_schema(SCHEMA_PATH)
    except ValueError as exc:
        errors.append(str(exc))
        validator = None  # type: ignore

    contract_paths = sorted(pathlib.Path("specs").rglob("contract.yaml"))
    if not contract_paths:
        print("No contract.yaml files found under specs/.")
    elif validator is not None:
        for path in contract_paths:
            errors.extend(lint_contract_file(path, validator))

    if args.base and args.head:
        try:
            changed_paths = get_changed_contract_paths(args.base, args.head)
            changed_api_paths = get_changed_api_paths(args.base, args.head)
        except RuntimeError as exc:
            errors.append(str(exc))
            changed_paths = []
            changed_api_paths = []

        if changed_paths:
            errors.extend(check_versioning(args.base, args.head, changed_paths))
        else:
            print("No changed contract.yaml files between provided SHAs.")

        if changed_api_paths:
            errors.extend(check_api_contract_coupling(args.base, args.head, changed_paths, changed_api_paths))
        else:
            print("No changed api.yaml files between provided SHAs.")
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
