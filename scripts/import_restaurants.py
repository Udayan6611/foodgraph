#!/usr/bin/env python3
"""Deterministic, repeatable importer for the legacy restaurants_v6.js catalogue.

Dry-run is the default. Applying requires --apply, DATABASE_URL and psycopg 3.
No external place IDs or missing provenance are invented.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import uuid
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse

NAMESPACE = uuid.UUID("9d12d29c-55e8-4a0b-9b2a-61b62c88c4f2")
SOURCE_FILE = "restaurants_v6.js"
CITY = {"name": "Pune", "state_code": "MH", "country_code": "IN", "slug": "pune"}
VALID_TIERS = {1, 2, 3, 4}


def stable_id(kind: str, value: str) -> str:
    return str(uuid.uuid5(NAMESPACE, f"{kind}:{value}"))


def slugify(value: str) -> str:
    value = value.casefold().strip()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def parse_catalogue(source: str) -> list[list]:
    marker = "const RESTAURANTS_V6 ="
    if marker not in source:
        raise ValueError(f"Missing {marker!r} declaration")
    start = source.index("[", source.index(marker))
    end = source.rfind(";")
    if end <= start:
        raise ValueError("Catalogue array is not terminated")
    rows = json.loads(source[start:end].strip())
    if not isinstance(rows, list) or not rows:
        raise ValueError("Catalogue must be a non-empty array")
    for number, row in enumerate(rows, 1):
        if not isinstance(row, list) or len(row) not in (6, 9):
            raise ValueError(f"Row {number}: expected 6 or 9 columns, got {len(row) if isinstance(row, list) else 'non-array'}")
        name, area, cuisine, vibe, rating, tier = row[:6]
        if not all(isinstance(x, str) and x.strip() for x in (name, area, cuisine, vibe)):
            raise ValueError(f"Row {number}: name, area, cuisine and vibe must be non-empty strings")
        if rating is not None and (not isinstance(rating, (int, float)) or not 0 <= rating <= 5):
            raise ValueError(f"Row {number}: rating must be null or between 0 and 5")
        if tier is not None and (not isinstance(tier, int) or tier not in VALID_TIERS):
            raise ValueError(f"Row {number}: legacy price tier must be null or 1-4")
        if len(row) == 9:
            reviews, url, evidence = row[6:]
            if reviews is not None and (not isinstance(reviews, int) or reviews < 0):
                raise ValueError(f"Row {number}: review count must be null or a non-negative integer")
            if url is not None and (not isinstance(url, str) or urlparse(url).scheme not in ("http", "https")):
                raise ValueError(f"Row {number}: source URL must be HTTP(S) or null")
            if evidence is not None and not isinstance(evidence, str):
                raise ValueError(f"Row {number}: evidence label must be text or null")
    return rows


def row_record(row: list, row_number: int) -> dict:
    name, area, cuisine_text, vibe_text, rating, tier = row[:6]
    reviews, source_url, evidence = (row[6:] if len(row) == 9 else (None, None, None))
    key = f"{slugify(name)}|{slugify(area)}"
    location_id = stable_id("location", key)
    restaurant_id = stable_id("restaurant", key)
    city_id = stable_id("city", "pune|mh|in")
    area_id = stable_id("area", f"pune|{slugify(area)}")
    cuisine_names = [x.strip() for x in cuisine_text.split(",") if x.strip()]
    cuisines = [{"name": x, "slug": slugify(x), "id": stable_id("cuisine", slugify(x))} for x in cuisine_names]
    canonical_row = json.dumps(row, ensure_ascii=False, separators=(",", ":"), sort_keys=False)
    digest = hashlib.sha256(canonical_row.encode("utf-8")).hexdigest()
    return {
        "row_number": row_number, "name": name.strip(), "area": area.strip(),
        "cuisine_text": cuisine_text, "vibe_text": vibe_text, "rating": rating,
        "price_tier": tier, "review_count": reviews, "source_url": source_url,
        "evidence_label": evidence, "raw_row": row, "digest": digest,
        "city_id": city_id, "area_id": area_id, "restaurant_id": restaurant_id,
        "location_id": location_id, "cuisines": cuisines,
        "ledger_id": stable_id("import-row", f"{SOURCE_FILE}|{row_number}"),
    }


def build_report(rows: list[list]) -> dict:
    records = [row_record(row, i) for i, row in enumerate(rows, 1)]
    names_areas = [f"{slugify(r['name'])}|{slugify(r['area'])}" for r in records]
    return {
        "source_file": SOURCE_FILE,
        "rows": len(records),
        "areas": len({r["area_id"] for r in records}),
        "cuisines": len({c["id"] for r in records for c in r["cuisines"]}),
        "row_shapes": dict(sorted(Counter(len(r) for r in rows).items())),
        "rows_with_source_url": sum(bool(r["source_url"]) for r in records),
        "rows_without_source_url": sum(not r["source_url"] for r in records),
        "duplicate_name_area_keys": len(names_areas) - len(set(names_areas)),
        "records": records,
    }


def source_type(url: str) -> str:
    host = (urlparse(url).hostname or "").lower()
    if "google." in host and "/maps" in url:
        return "maps"
    if any(x in host for x in ("district.in", "swiggy.com", "zomato.com")):
        return "directory"
    return "other"


def apply_import(records: list[dict], database_url: str) -> dict:
    try:
        import psycopg
        from psycopg.types.json import Jsonb
    except ImportError as exc:
        raise RuntimeError("Install the optional dependency with: pip install 'psycopg[binary]>=3.1,<4'") from exc

    counts = Counter()
    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            city = records[0]["city_id"]
            cur.execute(
                """insert into public.cities(id,name,state_code,country_code,slug)
                   values (%s,%s,%s,%s,%s)
                   on conflict (id) do update set name=excluded.name,state_code=excluded.state_code,
                     country_code=excluded.country_code,slug=excluded.slug""",
                (city, CITY["name"], CITY["state_code"], CITY["country_code"], CITY["slug"]),
            )
            for r in records:
                cur.execute(
                    """insert into public.areas(id,city_id,name,slug)
                       values (%s,%s,%s,%s)
                       on conflict (id) do update set name=excluded.name,slug=excluded.slug""",
                    (r["area_id"], r["city_id"], r["area"], slugify(r["area"])),
                )
                cur.execute(
                    """insert into public.restaurants(id,canonical_name,status)
                       values (%s,%s,'needs_review')
                       on conflict (id) do update set canonical_name=excluded.canonical_name""",
                    (r["restaurant_id"], r["name"]),
                )
                cur.execute(
                    """insert into public.restaurant_locations(id,restaurant_id,city_id,area_id,location_name,status)
                       values (%s,%s,%s,%s,%s,'unverified')
                       on conflict (id) do update set restaurant_id=excluded.restaurant_id,
                         city_id=excluded.city_id,area_id=excluded.area_id,location_name=excluded.location_name""",
                    (r["location_id"], r["restaurant_id"], r["city_id"], r["area_id"], r["name"]),
                )
                for idx, cuisine in enumerate(r["cuisines"]):
                    cur.execute(
                        """insert into public.cuisines(id,name,slug) values (%s,%s,%s)
                           on conflict (id) do update set name=excluded.name,slug=excluded.slug""",
                        (cuisine["id"], cuisine["name"], cuisine["slug"]),
                    )
                    cur.execute(
                        """insert into public.restaurant_location_cuisines(restaurant_location_id,cuisine_id,is_primary)
                           values (%s,%s,%s) on conflict do nothing""",
                        (r["location_id"], cuisine["id"], idx == 0),
                    )
                source_id = None
                if r["source_url"]:
                    source_id = stable_id("source", r["source_url"])
                    cur.execute(
                        """insert into public.catalogue_sources(id,source_type,source_name,source_url)
                           values (%s,%s,%s,%s)
                           on conflict (source_url) do update set source_name=excluded.source_name""",
                        (source_id, source_type(r["source_url"]), r["evidence_label"] or "Unlabelled source", r["source_url"]),
                    )
                    if r["rating"] is not None:
                        claim_id = stable_id("claim", f"{r['location_id']}|rating|{source_id}|{r['digest']}")
                        cur.execute(
                            """insert into public.catalogue_claims(id,restaurant_location_id,field_key,field_value,source_id)
                               values (%s,%s,'rating',%s,%s) on conflict (id) do nothing""",
                            (claim_id, r["location_id"], Jsonb({"value": r["rating"], "review_count": r["review_count"]}), source_id),
                        )
                    if r["price_tier"] is not None:
                        claim_id = stable_id("claim", f"{r['location_id']}|legacy_price_tier|{source_id}|{r['digest']}")
                        cur.execute(
                            """insert into public.catalogue_claims(id,restaurant_location_id,field_key,field_value,source_id)
                               values (%s,%s,'legacy_price_tier',%s,%s) on conflict (id) do nothing""",
                            (claim_id, r["location_id"], Jsonb({"tier": r["price_tier"], "meaning": "legacy prototype tier; not an INR price"}), source_id),
                        )
                cur.execute(
                    """insert into public.catalogue_import_rows
                       (id,source_file,source_row_number,content_sha256,raw_row,restaurant_location_id,import_status)
                       values (%s,%s,%s,%s,%s,%s,'imported')
                       on conflict (id) do update set content_sha256=excluded.content_sha256,
                         raw_row=excluded.raw_row,restaurant_location_id=excluded.restaurant_location_id,
                         import_status='imported',imported_at=now()""",
                    (r["ledger_id"], SOURCE_FILE, r["row_number"], r["digest"], Jsonb(r["raw_row"]), r["location_id"]),
                )
                counts["rows_processed"] += 1
    return dict(counts)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=Path(__file__).resolve().parents[1] / SOURCE_FILE)
    parser.add_argument("--apply", action="store_true", help="Write to the database; otherwise perform a dry run")
    parser.add_argument("--report-json", type=Path, help="Optional path for a machine-readable report")
    args = parser.parse_args()
    try:
        rows = parse_catalogue(args.source.read_text(encoding="utf-8"))
        report = build_report(rows)
        summary = {k: v for k, v in report.items() if k != "records"}
        if args.apply:
            database_url = os.environ.get("DATABASE_URL")
            if not database_url:
                raise RuntimeError("DATABASE_URL is required for --apply; do not place credentials in source control")
            summary["database_write"] = apply_import(report["records"], database_url)
        else:
            summary["mode"] = "dry-run"
        rendered = json.dumps(summary, indent=2, ensure_ascii=False)
        print(rendered)
        if args.report_json:
            args.report_json.write_text(rendered + "\n", encoding="utf-8")
        return 0
    except Exception as exc:
        print(f"catalogue import failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
