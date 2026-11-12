import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("import_restaurants", ROOT / "scripts" / "import_restaurants.py")
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)


class CatalogueImportTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = (ROOT / "restaurants_v6.js").read_text(encoding="utf-8")
        cls.rows = module.parse_catalogue(cls.source)

    def test_real_catalogue_shape_and_counts(self):
        report = module.build_report(self.rows)
        self.assertEqual(report["rows"], 162)
        self.assertEqual(report["areas"], 28)
        self.assertEqual(report["row_shapes"], {6: 105, 9: 57})
        self.assertEqual(report["rows_with_source_url"], 57)
        self.assertEqual(report["rows_without_source_url"], 105)

    def test_ids_are_deterministic_and_reordering_independent(self):
        first = module.row_record(self.rows[0], 1)
        again = module.row_record(self.rows[0], 1)
        self.assertEqual(first["location_id"], again["location_id"])
        self.assertEqual(first["ledger_id"], again["ledger_id"])

    def test_row_identity_keeps_different_areas_separate(self):
        row = self.rows[0]
        changed_area = list(row)
        changed_area[1] = "Different Area"
        self.assertNotEqual(
            module.row_record(row, 1)["location_id"],
            module.row_record(changed_area, 1)["location_id"],
        )

    def test_raw_row_and_missing_provenance_are_retained(self):
        record = module.row_record(self.rows[0], 1)
        self.assertEqual(record["raw_row"], self.rows[0])
        self.assertIsNone(record["source_url"])
        self.assertIsNone(record["evidence_label"])

    def test_source_url_rows_keep_source_and_review_metadata(self):
        record = next(module.row_record(r, i) for i, r in enumerate(self.rows, 1) if len(r) == 9)
        self.assertTrue(record["source_url"].startswith("http"))
        self.assertTrue(record["evidence_label"])

    def test_invalid_shapes_and_values_are_rejected(self):
        with self.assertRaises(ValueError):
            module.parse_catalogue("const RESTAURANTS_V6 = [[\"bad\"]];")
        with self.assertRaises(ValueError):
            module.parse_catalogue("const RESTAURANTS_V6 = [[\"Name\",\"Area\",\"Cuisine\",\"Vibe\",6,2]];")

    def test_duplicate_report_does_not_merge_records(self):
        duplicated = [self.rows[0], self.rows[0]]
        report = module.build_report(duplicated)
        self.assertEqual(report["rows"], 2)
        self.assertEqual(report["duplicate_name_area_keys"], 1)
        self.assertEqual(report["records"][0]["location_id"], report["records"][1]["location_id"])


if __name__ == "__main__":
    unittest.main()
