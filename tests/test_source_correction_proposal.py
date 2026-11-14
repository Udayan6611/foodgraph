import csv
import re
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from import_restaurants import stable_id


class SourceCorrectionProposalTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        csv_path = ROOT / "docs/data/catalogue-source-correction-proposal-2026-11-14.csv"
        with csv_path.open(encoding="utf-8", newline="") as handle:
            cls.rows = list(csv.DictReader(handle))
        cls.sql = (ROOT / "supabase/proposals/20261114_claim_source_corrections.sql").read_text(encoding="utf-8")

    def test_four_proposals_and_one_explicit_hold(self):
        proposed = [row for row in self.rows if row["decision"] == "proposed_reassign_rating_source"]
        held = [row for row in self.rows if row["decision"] == "hold_for_manual_source_review"]
        self.assertEqual(len(proposed), 4)
        self.assertEqual(len(held), 1)
        self.assertEqual(held[0]["restaurant"], "Malaka Spice")

    def test_source_ids_follow_importer_deterministic_uuid5_rule(self):
        for row in self.rows:
            if row["proposed_source_url"]:
                self.assertEqual(row["proposed_source_id"], stable_id("source", row["proposed_source_url"]))

    def test_sql_is_rollback_only_and_changes_only_rating_source_links(self):
        self.assertTrue(self.sql.rstrip().endswith("ROLLBACK;"))
        self.assertIsNone(re.search(r"(?im)^\s*COMMIT\s*;", self.sql))
        self.assertEqual(self.sql.count("UPDATE public.catalogue_claims AS claim"), 1)
        self.assertIn("SET source_id = proposal.proposed_source_id", self.sql)
        self.assertNotRegex(self.sql, r"(?i)SET\s+(status|field_value|verification_state|observed_at|valid_until)\s*=")
        for row in self.rows:
            if row["decision"] == "proposed_reassign_rating_source":
                self.assertIn(row["rating_claim_id"], self.sql)
                self.assertIn(row["old_source_id"], self.sql)
                self.assertIn(row["proposed_source_id"], self.sql)

    def test_sql_has_exactly_four_rating_claim_guards(self):
        self.assertEqual(self.sql.count("'rating'"), 1)  # one shared field-key guard
        self.assertEqual(self.sql.count("'unreviewed'"), 1)


if __name__ == "__main__":
    unittest.main()
