import importlib.util
import os
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("import_restaurants", ROOT / "scripts" / "import_restaurants.py")
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)
DATABASE_URL = os.environ.get("DATABASE_URL")


@unittest.skipUnless(DATABASE_URL, "DATABASE_URL is only set in the disposable local Supabase CI database")
class DatabaseImportIntegrationTests(unittest.TestCase):
    def test_repeated_import_is_idempotent(self):
        import psycopg
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute("select count(*) from public.catalogue_import_rows where source_file=%s", (module.SOURCE_FILE,))
                self.assertEqual(cur.fetchone()[0], 162)
                cur.execute("select count(distinct restaurant_location_id) from public.catalogue_import_rows where source_file=%s", (module.SOURCE_FILE,))
                self.assertEqual(cur.fetchone()[0], 162)

    def test_failed_batch_rolls_back_all_prior_writes(self):
        import psycopg
        rows = module.parse_catalogue((ROOT / module.SOURCE_FILE).read_text(encoding="utf-8"))
        first = module.row_record(rows[0], 990001)
        first["name"] = "FoodGraph Rollback Probe"
        first["area"] = "Rollback Probe Area"
        first["area_id"] = module.stable_id("area", "rollback-probe-area")
        first["location_id"] = module.stable_id("location", "rollback-probe|area")
        first["restaurant_id"] = module.stable_id("restaurant", "rollback-probe|area")
        first["ledger_id"] = module.stable_id("import-row", "rollback-probe-first")
        first["row_number"] = 990001

        second = dict(first)
        second["name"] = ""
        second["area"] = "Rollback Failure Area"
        second["area_id"] = module.stable_id("area", "rollback-failure-area")
        second["location_id"] = module.stable_id("location", "rollback-failure|area")
        second["restaurant_id"] = module.stable_id("restaurant", "rollback-failure|area")
        second["ledger_id"] = module.stable_id("import-row", "rollback-probe-failure")
        second["row_number"] = 990002

        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute("select count(*) from public.catalogue_import_rows")
                before = cur.fetchone()[0]
        with self.assertRaises(psycopg.Error):
            module.apply_import([first, second], DATABASE_URL)
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute("select count(*) from public.catalogue_import_rows")
                after = cur.fetchone()[0]
                cur.execute("select count(*) from public.restaurant_locations where id=%s", (first["location_id"],))
                first_location = cur.fetchone()[0]
        self.assertEqual(after, before)
        self.assertEqual(first_location, 0)


if __name__ == "__main__":
    unittest.main()
