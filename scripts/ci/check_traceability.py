#!/usr/bin/env python3
import pathlib
import re
import sys
from dataclasses import dataclass
from typing import Any, Dict, List, Set, Tuple

try:
    import yaml  # type: ignore
except Exception:
    print(
        "Missing Python dependencies for traceability checks. "
        "Install with: pip install -r scripts/ci/requirements.txt"
    )
    sys.exit(2)


PRISMA_MODEL_RE = re.compile(r"^\s*model\s+([A-Za-z][A-Za-z0-9_]*)\s+\{")
BACKTICK_RE = re.compile(r"`([^`]+)`")
RUNTIME_EVENT_ENTRY_RE = re.compile(r'^\s*"([A-Za-z0-9._-]+)"')
DATA_CHANGES_HEADING_RE = re.compile(r"^##\s+data changes\b", re.IGNORECASE)
LEVEL2_HEADING_RE = re.compile(r"^##\s+")
MIGRATION_ID_RE = re.compile(r"^\d{12}_[a-z0-9_]+$")
PROCESS_EVENT_ALLOWLIST = {"workitem.assigned", "qa.gate.passed", "qa.gate.failed"}


@dataclass
class TokenRef:
    path: pathlib.Path
    line: int
    token: str
    source: str


def read_text(path: pathlib.Path) -> str:
    return path.read_text(encoding="utf-8")


def parse_prisma_models(schema_path: pathlib.Path) -> Set[str]:
    if not schema_path.exists():
        raise ValueError(f"{schema_path}: file not found")

    models: Set[str] = set()
    for idx, line in enumerate(read_text(schema_path).splitlines(), start=1):
        match = PRISMA_MODEL_RE.match(line)
        if match:
            models.add(match.group(1))

    if not models:
        raise ValueError(f"{schema_path}: no Prisma models found")

    return models


def parse_runtime_domain_events(path: pathlib.Path) -> Set[str]:
    if not path.exists():
        raise ValueError(f"{path}: file not found")

    events: Set[str] = set()
    in_event_array = False

    for idx, raw_line in enumerate(read_text(path).splitlines(), start=1):
        line = raw_line.strip()
        if line.startswith("export const domainEventNames"):
            in_event_array = True
            continue

        if in_event_array and line.startswith("]"):
            in_event_array = False
            continue

        if not in_event_array:
            continue

        match = RUNTIME_EVENT_ENTRY_RE.match(line)
        if match:
            events.add(match.group(1))

    if not events:
        raise ValueError(f"{path}: no runtime domain events found")

    return events


def parse_data_ownership_tables(path: pathlib.Path) -> List[TokenRef]:
    if not path.exists():
        raise ValueError(f"{path}: file not found")

    refs: List[TokenRef] = []
    lines = read_text(path).splitlines()

    for idx, raw_line in enumerate(lines, start=1):
        line = raw_line.strip()
        if not line.startswith("|"):
            continue
        if line.startswith("| ---"):
            continue

        cells = [cell.strip() for cell in line.strip("|").split("|")]
        if len(cells) < 4:
            continue
        if cells[0].lower() == "domain":
            continue

        owned_tables_cell = cells[1]
        for token in BACKTICK_RE.findall(owned_tables_cell):
            refs.append(
                TokenRef(path=path, line=idx, token=token.strip(), source="data-ownership table")
            )

    return refs


def parse_data_ownership_event_refs(path: pathlib.Path) -> List[TokenRef]:
    if not path.exists():
        raise ValueError(f"{path}: file not found")

    refs: List[TokenRef] = []
    lines = read_text(path).splitlines()

    for idx, raw_line in enumerate(lines, start=1):
        line = raw_line.strip()
        if not line.startswith("|"):
            continue
        if line.startswith("| ---"):
            continue

        cells = [cell.strip() for cell in line.strip("|").split("|")]
        if len(cells) < 4:
            continue
        if cells[0].lower() == "domain":
            continue

        published_events_cell = cells[2]
        for token in BACKTICK_RE.findall(published_events_cell):
            value = token.strip()
            if not value or value.lower() == "none":
                continue
            refs.append(
                TokenRef(path=path, line=idx, token=value, source="data-ownership published event")
            )

    return refs


def parse_work_item_data_changes(
    work_items_dir: pathlib.Path,
) -> Tuple[List[TokenRef], List[TokenRef]]:
    if not work_items_dir.exists():
        raise ValueError(f"{work_items_dir}: directory not found")

    table_refs: List[TokenRef] = []
    migration_refs: List[TokenRef] = []

    work_item_paths = sorted(work_items_dir.glob("WI-*.md"))
    if not work_item_paths:
        raise ValueError(f"{work_items_dir}: no WI-*.md files found")

    for path in work_item_paths:
        in_data_changes = False
        for idx, raw_line in enumerate(read_text(path).splitlines(), start=1):
            line = raw_line.strip()
            if LEVEL2_HEADING_RE.match(line):
                in_data_changes = bool(DATA_CHANGES_HEADING_RE.match(line))
                continue

            if not in_data_changes:
                continue

            for token in BACKTICK_RE.findall(raw_line):
                value = token.strip()
                if MIGRATION_ID_RE.match(value):
                    migration_refs.append(
                        TokenRef(
                            path=path,
                            line=idx,
                            token=value,
                            source="work-item migration",
                        )
                    )
                else:
                    table_refs.append(
                        TokenRef(path=path, line=idx, token=value, source="work-item table")
                    )

    return table_refs, migration_refs


def parse_contract_migrations(specs_dir: pathlib.Path) -> Tuple[List[TokenRef], List[str]]:
    if not specs_dir.exists():
        raise ValueError(f"{specs_dir}: directory not found")

    refs: List[TokenRef] = []
    errors: List[str] = []

    contract_paths = sorted(specs_dir.rglob("contract.yaml"))
    if not contract_paths:
        raise ValueError(f"{specs_dir}: no contract.yaml files found")

    for path in contract_paths:
        text = read_text(path)
        lines = text.splitlines()
        try:
            parsed: Dict[str, Any] = yaml.safe_load(text) or {}
        except Exception as exc:
            errors.append(f"{path}: invalid YAML ({exc})")
            continue

        if not isinstance(parsed, dict):
            errors.append(f"{path}: root YAML node must be an object")
            continue

        db_changes = parsed.get("db_changes")
        if not isinstance(db_changes, dict):
            errors.append(f"{path}: db_changes must be an object")
            continue

        migrations = db_changes.get("migrations")
        if not isinstance(migrations, list):
            errors.append(f"{path}: db_changes.migrations must be an array")
            continue

        for idx, migration_entry in enumerate(migrations, start=1):
            if not isinstance(migration_entry, dict):
                errors.append(
                    f"{path}: db_changes.migrations[{idx}] must be an object with an id field"
                )
                continue

            migration_id = migration_entry.get("id")
            if not isinstance(migration_id, str) or not migration_id.strip():
                errors.append(f"{path}: db_changes.migrations[{idx}].id must be a non-empty string")
                continue

            line_number = find_line_number(lines, migration_id)
            refs.append(
                TokenRef(
                    path=path,
                    line=line_number,
                    token=migration_id.strip(),
                    source="contract migration",
                )
            )

    return refs, errors


def parse_contract_published_events(specs_dir: pathlib.Path) -> Tuple[List[TokenRef], List[str]]:
    if not specs_dir.exists():
        raise ValueError(f"{specs_dir}: directory not found")

    refs: List[TokenRef] = []
    errors: List[str] = []

    contract_paths = sorted(specs_dir.rglob("contract.yaml"))
    if not contract_paths:
        raise ValueError(f"{specs_dir}: no contract.yaml files found")

    for path in contract_paths:
        text = read_text(path)
        lines = text.splitlines()
        try:
            parsed: Dict[str, Any] = yaml.safe_load(text) or {}
        except Exception as exc:
            errors.append(f"{path}: invalid YAML ({exc})")
            continue

        if not isinstance(parsed, dict):
            errors.append(f"{path}: root YAML node must be an object")
            continue

        api_node = parsed.get("api")
        if not isinstance(api_node, dict):
            errors.append(f"{path}: api must be an object")
            continue

        events_node = api_node.get("events")
        if not isinstance(events_node, dict):
            errors.append(f"{path}: api.events must be an object")
            continue

        published = events_node.get("published")
        if not isinstance(published, list):
            errors.append(f"{path}: api.events.published must be an array")
            continue

        for idx, event_entry in enumerate(published, start=1):
            if not isinstance(event_entry, dict):
                errors.append(
                    f"{path}: api.events.published[{idx}] must be an object with a name field"
                )
                continue

            name = event_entry.get("name")
            if not isinstance(name, str) or not name.strip():
                errors.append(f"{path}: api.events.published[{idx}].name must be a non-empty string")
                continue

            refs.append(
                TokenRef(
                    path=path,
                    line=find_line_number(lines, name),
                    token=name.strip(),
                    source="contract published event",
                )
            )

    return refs, errors


def find_line_number(lines: List[str], token: str) -> int:
    for idx, line in enumerate(lines, start=1):
        if token in line:
            return idx
    return 1


def parse_migration_directories(migrations_dir: pathlib.Path) -> Set[str]:
    if not migrations_dir.exists():
        raise ValueError(f"{migrations_dir}: directory not found")

    migration_ids: Set[str] = set()
    for child in migrations_dir.iterdir():
        if child.is_dir():
            migration_ids.add(child.name)
    return migration_ids


def validate_table_refs(refs: List[TokenRef], prisma_models: Set[str]) -> List[str]:
    errors: List[str] = []
    for ref in refs:
        if ref.token not in prisma_models:
            errors.append(
                f"{ref.path}:{ref.line}: {ref.source} `{ref.token}` is not a Prisma model in prisma/schema.prisma"
            )
    return errors


def validate_migration_refs(refs: List[TokenRef], migration_ids: Set[str]) -> List[str]:
    errors: List[str] = []
    for ref in refs:
        if not MIGRATION_ID_RE.match(ref.token):
            errors.append(
                f"{ref.path}:{ref.line}: {ref.source} `{ref.token}` must match migration id format YYYYMMDDNNNN_description"
            )
            continue
        if ref.token not in migration_ids:
            errors.append(
                f"{ref.path}:{ref.line}: {ref.source} `{ref.token}` not found in prisma/migrations/"
            )
    return errors


def validate_migration_cross_reference(
    contract_refs: List[TokenRef], work_item_refs: List[TokenRef], migration_ids: Set[str]
) -> List[str]:
    errors: List[str] = []

    contract_ids = {ref.token for ref in contract_refs}
    work_item_ids = {ref.token for ref in work_item_refs}

    missing_in_work_items = sorted(contract_ids - work_item_ids)
    if missing_in_work_items:
        errors.append(
            "Migration IDs referenced in contracts but missing in work-items: "
            + ", ".join(missing_in_work_items)
        )

    missing_in_contracts = sorted(work_item_ids - contract_ids)
    if missing_in_contracts:
        errors.append(
            "Migration IDs referenced in work-items but missing in contracts: "
            + ", ".join(missing_in_contracts)
        )

    unreferenced_migrations = sorted(migration_ids - contract_ids - work_item_ids)
    if unreferenced_migrations:
        errors.append(
            "Migration directories not referenced by contracts/work-items: "
            + ", ".join(unreferenced_migrations)
        )

    return errors


def validate_event_refs_against_runtime(
    refs: List[TokenRef], runtime_events: Set[str], allowlist: Set[str] | None = None
) -> List[str]:
    errors: List[str] = []
    allowed = allowlist or set()
    for ref in refs:
        if ref.token in runtime_events or ref.token in allowed:
            continue
        errors.append(
            f"{ref.path}:{ref.line}: {ref.source} `{ref.token}` is not defined in runtime domainEventNames"
        )
    return errors


def validate_runtime_event_coverage(
    runtime_events: Set[str], contract_event_refs: List[TokenRef], ownership_event_refs: List[TokenRef]
) -> List[str]:
    errors: List[str] = []
    contract_events = {ref.token for ref in contract_event_refs}
    ownership_events = {ref.token for ref in ownership_event_refs}

    missing_in_contracts = sorted(runtime_events - contract_events)
    if missing_in_contracts:
        errors.append(
            "Runtime domain events missing from contract published event definitions: "
            + ", ".join(missing_in_contracts)
        )

    missing_in_ownership = sorted(runtime_events - ownership_events)
    if missing_in_ownership:
        errors.append(
            "Runtime domain events missing from docs/data-ownership published events: "
            + ", ".join(missing_in_ownership)
        )

    return errors


def main() -> int:
    errors: List[str] = []

    try:
        prisma_models = parse_prisma_models(pathlib.Path("prisma/schema.prisma"))
    except ValueError as exc:
        errors.append(str(exc))
        prisma_models = set()

    try:
        runtime_domain_events = parse_runtime_domain_events(
            pathlib.Path("src/features/shared/domain-event-publisher.ts")
        )
    except ValueError as exc:
        errors.append(str(exc))
        runtime_domain_events = set()

    try:
        ownership_table_refs = parse_data_ownership_tables(pathlib.Path("docs/data-ownership.md"))
    except ValueError as exc:
        errors.append(str(exc))
        ownership_table_refs = []

    try:
        ownership_event_refs = parse_data_ownership_event_refs(pathlib.Path("docs/data-ownership.md"))
    except ValueError as exc:
        errors.append(str(exc))
        ownership_event_refs = []

    try:
        work_item_table_refs, work_item_migration_refs = parse_work_item_data_changes(
            pathlib.Path("work-items")
        )
    except ValueError as exc:
        errors.append(str(exc))
        work_item_table_refs = []
        work_item_migration_refs = []

    try:
        contract_migration_refs, contract_parse_errors = parse_contract_migrations(pathlib.Path("specs"))
        errors.extend(contract_parse_errors)
    except ValueError as exc:
        errors.append(str(exc))
        contract_migration_refs = []

    try:
        contract_event_refs, contract_event_errors = parse_contract_published_events(pathlib.Path("specs"))
        errors.extend(contract_event_errors)
    except ValueError as exc:
        errors.append(str(exc))
        contract_event_refs = []

    try:
        migration_ids = parse_migration_directories(pathlib.Path("prisma/migrations"))
    except ValueError as exc:
        errors.append(str(exc))
        migration_ids = set()

    if prisma_models:
        errors.extend(validate_table_refs(ownership_table_refs, prisma_models))
        errors.extend(validate_table_refs(work_item_table_refs, prisma_models))

    if migration_ids:
        errors.extend(validate_migration_refs(contract_migration_refs, migration_ids))
        errors.extend(validate_migration_refs(work_item_migration_refs, migration_ids))
        errors.extend(
            validate_migration_cross_reference(
                contract_migration_refs, work_item_migration_refs, migration_ids
            )
        )

    if runtime_domain_events:
        errors.extend(validate_event_refs_against_runtime(contract_event_refs, runtime_domain_events))
        errors.extend(
            validate_event_refs_against_runtime(
                ownership_event_refs, runtime_domain_events, PROCESS_EVENT_ALLOWLIST
            )
        )
        errors.extend(
            validate_runtime_event_coverage(
                runtime_domain_events, contract_event_refs, ownership_event_refs
            )
        )

    if errors:
        print("Traceability checks failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Traceability checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
