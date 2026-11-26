"""Export the local CMS SQLite and JSON stores as a PostgreSQL import."""

import argparse
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import sqlite3


MASTER_TABLES = (
    ("states", "LocationState", None),
    ("ranges", "LocationRange", "stateId"),
    ("districts", "District", "rangeId"),
    ("policeStations", "LocationPoliceStation", "districtId"),
)


def identifier(value):
    return '"' + value.replace('"', '""') + '"'


def literal(value, declared_type="TEXT"):
    if value is None:
        return "NULL"
    if declared_type == "BOOLEAN":
        if value not in (0, 1):
            raise ValueError("Unexpected SQLite boolean value")
        return "TRUE" if value else "FALSE"
    if declared_type == "DATETIME":
        if isinstance(value, int):
            value = datetime(1970, 1, 1, tzinfo=timezone.utc) + timedelta(milliseconds=value)
        else:
            value = datetime.fromisoformat(value)
        if value.tzinfo is not None:
            value = value.astimezone(timezone.utc).replace(tzinfo=None)
        return literal(value.isoformat(sep=" ")) + "::timestamp"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, str):
        if "\x00" in value:
            raise ValueError("PostgreSQL text cannot contain a NUL character")
        return "'" + value.replace("'", "''") + "'"
    raise ValueError(f"Unsupported SQLite value: {type(value).__name__}")


def ordered_tables(db):
    tables = {row[0] for row in db.execute("""
        SELECT name FROM sqlite_schema
        WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
          AND name <> '_prisma_migrations'
    """)}
    dependencies = {
        name: {row[2] for row in db.execute("SELECT * FROM pragma_foreign_key_list(?)", (name,))
               if row[2] != name}
        for name in tables
    }
    result = []
    while tables:
        ready = sorted(name for name in tables if dependencies[name].issubset(result))
        if not ready:
            raise ValueError("Cannot order SQLite tables by foreign-key dependencies")
        result.extend(ready)
        tables.difference_update(ready)
    return result


def insert_rows(output, table, columns, rows):
    if not rows:
        return
    fields = ", ".join(identifier(column) for column in columns)
    output.write(f"INSERT INTO {identifier(table)} ({fields}) VALUES\n")
    output.write(",\n".join("(" + ", ".join(row) + ")" for row in rows))
    output.write(";\n")


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write_import(db, data_dir, output):
    output.write("BEGIN;\nSET LOCAL standard_conforming_strings = on;\n")
    counts = {}
    for table in ordered_tables(db):
        column_info = db.execute("SELECT name, type FROM pragma_table_info(?)", (table,)).fetchall()
        columns, types = zip(*column_info)
        rows = db.execute(f"SELECT * FROM {identifier(table)}").fetchall()
        insert_rows(output, table, columns, [
            [literal(value, kind) for value, kind in zip(row, types)] for row in rows
        ])
        counts[table] = len(rows)

    master_path = data_dir / "locations-master-store.json"
    if master_path.is_file():
        master = read_json(master_path)
        for key, table, parent in MASTER_TABLES:
            fields = ("id", "code", "name", "status") + ((parent,) if parent else ())
            records = master[key]
            insert_rows(output, table, (*fields, "details"), [
                [*(literal(record[field]) for field in fields),
                 literal(json.dumps(record, ensure_ascii=False)) + "::jsonb"]
                for record in records
            ])
            counts[table] = len(records)

    case_tables = {
        "complaints-store.json": "ComplaintRecord",
        "firs-store.json": "FirRecord",
    }
    documents = []
    for path in sorted(data_dir.rglob("*.json")):
        if not path.is_file():
            continue
        table = case_tables.get(path.relative_to(data_dir).as_posix())
        if table is None:
            documents.append(path)
            continue
        records = read_json(path)
        insert_rows(output, table, ("id", "position", "payload"), [
            [literal(record["id"]), str(position),
             literal(json.dumps(record, ensure_ascii=False, allow_nan=False)) + "::jsonb"]
            for position, record in enumerate(records, start=1)
        ])
        counts[table] = len(records)

    for path in documents:
        insert_rows(output, "ImportedJsonDocument", ("path", "payload"), [[
            literal(path.relative_to(data_dir).as_posix()),
            literal(json.dumps(read_json(path), ensure_ascii=False, allow_nan=False)) + "::jsonb",
        ]])
    counts["ImportedJsonDocument"] = len(documents)
    for table, count in counts.items():
        output.write(
            f"DO $$ BEGIN IF (SELECT COUNT(*) FROM {identifier(table)}) <> {count} "
            f"THEN RAISE EXCEPTION 'Row count mismatch for %', {literal(table)}; END IF; END $$;\n"
        )
    output.write("COMMIT;\n")
    return counts


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sqlite", type=Path, default=Path("prisma/dev.db"))
    parser.add_argument("--data-dir", type=Path, default=Path("prisma"))
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if not args.data_dir.is_dir():
        parser.error("--data-dir must point to the Prisma data directory")
    connection = sqlite3.connect(args.sqlite.resolve().as_uri() + "?mode=ro", uri=True)
    try:
        connection.execute("BEGIN")
        with args.output.open("x", encoding="utf-8", newline="\n") as output:
            try:
                counts = write_import(connection, args.data_dir, output)
            except BaseException:
                output.close()
                args.output.unlink()
                raise
    finally:
        connection.close()
    for table, count in counts.items():
        print(f"{table}: {count}")


if __name__ == "__main__":
    main()
