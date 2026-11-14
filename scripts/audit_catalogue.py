#!/usr/bin/env python3
"""Read-only quality and provenance audit for the hosted FoodGraph catalogue.

Requires DATABASE_URL and psycopg 3. The database transaction is explicitly
READ ONLY. This script never updates, activates, deletes, or imports records.
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import unicodedata
from collections import Counter, defaultdict
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.parse import urlparse


def normalize_identity(value: str | None) -> str:
    """Unicode-aware identity key; do not transliterate or discard non-Latin names."""
    text = unicodedata.normalize("NFKD", value or "").casefold().strip()
    text = "".join(char for char in text if unicodedata.category(char) != "Mn")
    return "".join(char for char in text if char.isalnum())


def source_url_kind(url: str | None) -> str:
    """Distinguish a Google Maps search pointer from a direct listing URL."""
    if not url:
        return "no_url"
    parsed = urlparse(url)
    host = (parsed.hostname or "").casefold()
    path = parsed.path.casefold()
    if ("google." in host or host.endswith("goo.gl")) and (
        "/maps/search" in path or "query=" in parsed.query.casefold()
    ):
        return "maps_search_pointer"
    return "url_requires_review"


def candidate_review_state(
    has_source_url: bool,
    possible_identity_collision: bool = False,
) -> str:
    """Prioritise identity resolution before evidence review."""
    if possible_identity_collision:
        return "identity_review_required"
    if has_source_url:
        return "evidence_review_required"
    return "source_discovery_required"


def _json_default(value: object) -> str:
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return str(value)


def read_snapshot(database_url: str) -> dict:
    """Read all catalogue audit inputs under one PostgreSQL read-only transaction."""
    try:
        import psycopg
        from psycopg.rows import dict_row
    except ImportError as exc:
        raise RuntimeError(
            "Install the database driver with: pip install -r requirements-dev.txt"
        ) from exc

    with psycopg.connect(database_url, row_factory=dict_row) as conn:
        conn.execute("SET TRANSACTION READ ONLY")
        candidates = conn.execute(
            """
            select
                r.id::text as restaurant_id,
                l.id::text as location_id,
                r.canonical_name,
                r.brand_name,
                r.description,
                r.status as restaurant_status,
                l.location_name,
                l.address_text,
                l.latitude,
                l.longitude,
                l.maps_provider,
                l.maps_place_id,
                l.price_min,
                l.price_max,
                l.status as location_status,
                a.name as area,
                ct.name as city
            from public.restaurant_locations l
            join public.restaurants r on r.id = l.restaurant_id
            left join public.areas a on a.id = l.area_id
            left join public.cities ct on ct.id = l.city_id
            order by ct.name, a.name, r.canonical_name, l.id
            """
        ).fetchall()
        claims = conn.execute(
            """
            select
                cl.id::text as claim_id,
                cl.restaurant_location_id::text as location_id,
                cl.field_key,
                cl.field_value,
                cl.verification_state,
                cl.observed_at,
                cl.valid_until,
                s.id::text as source_id,
                s.source_type,
                s.source_name,
                s.source_url
            from public.catalogue_claims cl
            left join public.catalogue_sources s on s.id = cl.source_id
            order by cl.restaurant_location_id, cl.field_key, cl.id
            """
        ).fetchall()
        sources = conn.execute(
            """
            select id::text as source_id, source_type, source_name, source_url,
                   accessed_at, reliability_note
            from public.catalogue_sources
            order by source_type, source_name, source_url
            """
        ).fetchall()
        cuisine_links = conn.execute(
            """
            select rlc.restaurant_location_id::text as location_id,
                   cu.name as cuisine, rlc.is_primary,
                   s.id::text as source_id, s.source_url
            from public.restaurant_location_cuisines rlc
            join public.cuisines cu on cu.id = rlc.cuisine_id
            left join public.catalogue_sources s on s.id = rlc.source_id
            order by rlc.restaurant_location_id, rlc.is_primary desc, cu.name
            """
        ).fetchall()
        import_rows = conn.execute(
            """
            select restaurant_location_id::text as location_id,
                   source_file, source_row_number, raw_row
            from public.catalogue_import_rows
            order by source_file, source_row_number
            """
        ).fetchall()
        conn.rollback()

    return {
        "candidates": candidates,
        "claims": claims,
        "sources": sources,
        "cuisine_links": cuisine_links,
        "import_rows": import_rows,
    }


def build_report(snapshot: dict) -> dict:
    candidates = snapshot["candidates"]
    claims = snapshot["claims"]
    sources = snapshot["sources"]
    cuisine_links = snapshot["cuisine_links"]
    import_rows = snapshot["import_rows"]

    claims_by_location: dict[str, list[dict]] = defaultdict(list)
    cuisines_by_location: dict[str, list[dict]] = defaultdict(list)
    imports_by_location: dict[str, list[dict]] = defaultdict(list)
    for claim in claims:
        claims_by_location[claim["location_id"]].append(claim)
    for link in cuisine_links:
        cuisines_by_location[link["location_id"]].append(link)
    for row in import_rows:
        if row["location_id"]:
            imports_by_location[row["location_id"]].append(row)

    name_area_groups: dict[tuple[str, str], list[dict]] = defaultdict(list)
    name_groups: dict[str, list[dict]] = defaultdict(list)
    for row in candidates:
        name_key = normalize_identity(row["canonical_name"])
        area_key = normalize_identity(row["area"])
        if name_key:
            name_area_groups[(name_key, area_key)].append(row)
            name_groups[name_key].append(row)

    same_area_collisions = {
        location["location_id"]
        for group in name_area_groups.values() if len(group) > 1
        for location in group
    }
    cross_area_collisions = {
        location["location_id"]
        for group in name_groups.values()
        if len({normalize_identity(item["area"]) for item in group}) > 1
        for location in group
    }

    candidate_reports = []
    for row in candidates:
        location_id = row["location_id"]
        location_claims = claims_by_location[location_id]
        location_cuisines = cuisines_by_location[location_id]
        location_imports = imports_by_location[location_id]
        claim_urls = sorted({
            claim["source_url"] for claim in location_claims if claim["source_url"]
        })
        cuisine_urls = sorted({
            link["source_url"] for link in location_cuisines if link["source_url"]
        })
        source_urls = sorted(set(claim_urls + cuisine_urls))
        source_names = sorted({
            claim["source_name"] for claim in location_claims if claim["source_name"]
        })
        source_kinds = sorted({source_url_kind(url) for url in source_urls})
        unreviewed = [
            claim for claim in location_claims
            if claim["verification_state"] == "unreviewed"
        ]
        legacy_tiers = [
            claim for claim in location_claims if claim["field_key"] == "legacy_price_tier"
        ]
        identity_collision = (
            location_id in same_area_collisions or location_id in cross_area_collisions
        )
        flags = []
        if not row["address_text"]:
            flags.append("missing_address")
        if row["latitude"] is None or row["longitude"] is None:
            flags.append("missing_coordinate_pair")
        if not row["maps_place_id"]:
            flags.append("missing_maps_place_id")
        if row["price_min"] is None and row["price_max"] is None:
            flags.append("missing_numeric_price_range")
        if not row["brand_name"]:
            flags.append("missing_parent_brand_name")
        if not row["description"]:
            flags.append("missing_description")
        if unreviewed:
            flags.append("unreviewed_claims_present")
        if any(claim["observed_at"] is None for claim in location_claims):
            flags.append("claims_missing_observation_date")
        if any(claim["valid_until"] is None for claim in location_claims):
            flags.append("claims_missing_validity_date")
        if not source_urls:
            flags.append("no_claim_or_cuisine_source_url")
        if "maps_search_pointer" in source_kinds:
            flags.append("google_maps_search_pointer_only")
        if location_id in same_area_collisions:
            flags.append("possible_duplicate_name_and_area")
        if location_id in cross_area_collisions:
            flags.append("same_normalized_name_across_areas")

        state = candidate_review_state(bool(source_urls), identity_collision)
        if state == "identity_review_required":
            next_action = "Resolve brand-versus-branch identity and exact outlet before enrichment"
        elif state == "source_discovery_required":
            next_action = "Find a current primary or authoritative source before adding factual fields"
        else:
            next_action = "Recheck each claim against its linked source; capture provider and observation date"
        candidate_reports.append({
            **row,
            "cuisines": sorted({link["cuisine"] for link in location_cuisines}),
            "source_urls": source_urls,
            "source_names": source_names,
            "source_url_kinds": source_kinds,
            "claim_count": len(location_claims),
            "unreviewed_claim_count": len(unreviewed),
            "claims_missing_observed_at": sum(claim["observed_at"] is None for claim in location_claims),
            "claims_missing_valid_until": sum(claim["valid_until"] is None for claim in location_claims),
            "legacy_price_tier_claim_count": len(legacy_tiers),
            "import_row_count": len(location_imports),
            "flags": flags,
            "review_state": state,
            "next_action": next_action,
        })

    source_types = Counter(item["source_type"] for item in sources)
    claim_fields = Counter(item["field_key"] for item in claims)
    claim_states = Counter(item["verification_state"] for item in claims)
    summary = {
        "locations": len(candidates),
        "restaurants": len({row["restaurant_id"] for row in candidates}),
        "addresses_present": sum(bool(row["address_text"]) for row in candidates),
        "coordinate_pairs_present": sum(
            row["latitude"] is not None and row["longitude"] is not None for row in candidates
        ),
        "maps_place_ids_present": sum(bool(row["maps_place_id"]) for row in candidates),
        "numeric_price_ranges_present": sum(
            row["price_min"] is not None or row["price_max"] is not None for row in candidates
        ),
        "active_locations": sum(row["location_status"] == "active" for row in candidates),
        "parent_brand_names_present": sum(bool(row["brand_name"]) for row in candidates),
        "parent_descriptions_present": sum(bool(row["description"]) for row in candidates),
        "cuisine_links": len(cuisine_links),
        "distinct_cuisines": len({link["cuisine"] for link in cuisine_links}),
        "sources": len(sources),
        "sources_with_url": sum(bool(source["source_url"]) for source in sources),
        "source_types": dict(sorted(source_types.items())),
        "claims": len(claims),
        "claim_fields": dict(sorted(claim_fields.items())),
        "claim_states": dict(sorted(claim_states.items())),
        "claims_missing_observed_at": sum(claim["observed_at"] is None for claim in claims),
        "claims_missing_valid_until": sum(claim["valid_until"] is None for claim in claims),
        "import_rows": len(import_rows),
        "same_name_and_area_collision_groups": sum(
            len(group) > 1 for group in name_area_groups.values()
        ),
        "same_normalized_name_across_area_groups": sum(
            len({normalize_identity(item["area"]) for item in group}) > 1
            for group in name_groups.values()
        ),
        "review_states": dict(sorted(Counter(
            item["review_state"] for item in candidate_reports
        ).items())),
    }
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "transaction_mode": "READ ONLY",
        "summary": summary,
        "sources": sources,
        "claims": claims,
        "candidates": candidate_reports,
    }


def write_csv(path: Path, candidates: list[dict]) -> None:
    fields = [
        "location_id", "restaurant_id", "canonical_name", "location_name", "city",
        "area", "restaurant_status", "location_status", "address_text", "latitude",
        "longitude", "maps_provider", "maps_place_id", "price_min", "price_max",
        "brand_name", "description", "cuisines", "source_names", "source_urls",
        "source_url_kinds", "claim_count", "unreviewed_claim_count",
        "claims_missing_observed_at", "claims_missing_valid_until",
        "legacy_price_tier_claim_count", "import_row_count", "flags",
        "review_state", "next_action",
    ]
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        for row in candidates:
            output = dict(row)
            for field in ("cuisines", "source_names", "source_urls", "source_url_kinds", "flags"):
                output[field] = " | ".join(output[field])
            writer.writerow(output)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json-out", type=Path, help="Write the full read-only snapshot as JSON")
    parser.add_argument("--csv-out", type=Path, help="Write one QA row per location as CSV")
    args = parser.parse_args()
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        parser.error("DATABASE_URL must be supplied through the environment; never commit it")
    try:
        report = build_report(read_snapshot(database_url))
        if args.json_out:
            args.json_out.parent.mkdir(parents=True, exist_ok=True)
            args.json_out.write_text(
                json.dumps(report, ensure_ascii=False, indent=2, default=_json_default) + "\n",
                encoding="utf-8",
            )
        if args.csv_out:
            write_csv(args.csv_out, report["candidates"])
        if not args.json_out and not args.csv_out:
            print(json.dumps(
                {"generated_at": report["generated_at"], "summary": report["summary"]},
                ensure_ascii=False, indent=2, default=_json_default,
            ))
        else:
            print(json.dumps({
                "generated_at": report["generated_at"],
                "summary": report["summary"],
                "json_out": str(args.json_out) if args.json_out else None,
                "csv_out": str(args.csv_out) if args.csv_out else None,
            }, ensure_ascii=False, indent=2, default=_json_default))
        return 0
    except Exception as exc:
        print(f"catalogue audit failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
